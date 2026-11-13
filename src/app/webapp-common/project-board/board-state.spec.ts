import {Observable, of, Subject, throwError} from 'rxjs';
import {Board, BoardCard} from './board.model';
import {BoardState} from './board-state';

const card = (id: string, over: Partial<BoardCard> = {}): BoardCard => ({id, type: 'plot', x: 0, y: 0, w: 3, h: 12, settings: {}, ...over});
const server = (message: string) => ({error: {meta: {result_msg: message}}});

function setup(save: (board: Board) => Observable<{version: number}>, serverBoard: Board | null = null) {
  const fallback = (): Board => ({version: 0, cards: [card('default')]});
  const state = new BoardState({save, load: () => of(serverBoard), fallback});
  state.load(serverBoard, fallback());
  return state;
}

const tick = (ms: number) => jasmine.clock().tick(ms);

describe('BoardState', () => {
  beforeEach(() => jasmine.clock().install());
  afterEach(() => jasmine.clock().uninstall());

  it('shows the default board for a project that has none, at version 0', () => {
    const state = setup(() => of({version: 1}));
    expect(state.board().cards.map(c => c.id)).toEqual(['default']);
    expect(state.board().version).toBe(0);
  });

  it('saves once for a burst of changes, after the quiet time', () => {
    const saved: Board[] = [];
    const state = setup(board => { saved.push(board); return of({version: board.version + 1}); });
    for (let n = 1; n <= 5; n++) {
      state.updateCards([card('a', {x: n % 3})]);
      tick(200);
    }
    expect(saved.length).toBe(0);
    tick(1000);
    expect(saved.length).toBe(1);
    expect(saved[0].cards[0].x).toBe(2);
  });

  it('names the version it read in the next save', () => {
    const versions: number[] = [];
    const state = setup(board => { versions.push(board.version); return of({version: board.version + 1}); });
    state.updateCards([card('a')]);
    tick(1000);
    state.updateCards([card('a', {y: 12})]);
    tick(1000);
    expect(versions).toEqual([0, 1]);
    expect(state.board().version).toBe(2);
  });

  it('never runs two saves at once: a change made during a save is saved after it', () => {
    const finish: Subject<{version: number}>[] = [];
    const sent: number[] = [];
    const state = setup(board => { const s = new Subject<{version: number}>(); finish.push(s); sent.push(board.cards.length); return s; });
    state.updateCards([card('a')]);
    tick(1000);
    expect(state.saving()).toBeTrue();
    state.updateCards([card('a'), card('b')]);
    tick(1000);
    expect(finish.length).toBe(1);
    finish[0].next({version: 1});
    finish[0].complete();
    tick(1000);
    expect(finish.length).toBe(2);
    expect(sent).toEqual([1, 2]);
  });

  it('marks a conflict when the server says someone else saved, and does not retry', () => {
    let calls = 0;
    const state = setup(() => { calls++; return throwError(() => server('the overview board was changed by someone else; reload it')); });
    state.updateCards([card('a')]);
    tick(1000);
    expect(state.conflict()).toBeTrue();
    tick(5000);
    expect(calls).toBe(1);
    state.updateCards([card('a', {x: 3})]);
    tick(5000);
    expect(calls).toBe(1);
  });

  it('shows another failure as an error and keeps the board', () => {
    const state = setup(() => throwError(() => server('the overview board is not valid: card a does not fit')));
    state.updateCards([card('a')]);
    tick(1000);
    expect(state.conflict()).toBeFalse();
    expect(state.error()).toContain('does not fit');
    expect(state.board().cards.map(c => c.id)).toEqual(['a']);
  });

  it('reload takes the server board again and clears the conflict', () => {
    const theirs: Board = {version: 4, cards: [card('theirs')]};
    const state = new BoardState({
      save: () => throwError(() => server('the overview board was changed by someone else; reload it')),
      load: () => of(theirs), fallback: () => ({version: 0, cards: []})});
    state.load(null, {version: 0, cards: [card('mine')]});
    state.updateCards([card('mine', {x: 1})]);
    tick(1000);
    expect(state.conflict()).toBeTrue();
    state.reload();
    expect(state.conflict()).toBeFalse();
    expect(state.board()).toEqual(theirs);
  });

  it('leaving edit mode saves a pending change at once', () => {
    let calls = 0;
    const state = setup(board => { calls++; return of({version: board.version + 1}); });
    state.setEditing(true);
    state.updateCards([card('a')]);
    state.setEditing(false);
    expect(calls).toBe(1);
    tick(2000);
    expect(calls).toBe(1);
  });

  it('adds and removes a card', () => {
    const state = setup(board => of({version: board.version + 1}));
    state.addCard(card('new', {y: 56}));
    expect(state.board().cards.map(c => c.id)).toEqual(['default', 'new']);
    state.removeCard('default');
    expect(state.board().cards.map(c => c.id)).toEqual(['new']);
    tick(1000);
  });
});
