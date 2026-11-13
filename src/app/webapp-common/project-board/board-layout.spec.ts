import {BoardCard} from './board.model';
import {nextFreePosition, normalizeBoard, readingOrder} from './board-layout';

const card = (over: Partial<BoardCard> = {}): BoardCard =>
  ({id: 'a', type: 'plot', x: 0, y: 0, w: 3, h: 12, settings: {}, ...over});

describe('normalizeBoard', () => {
  it('keeps a valid board', () => {
    expect(normalizeBoard({version: 2, cards: [card()]})).toEqual({version: 2, cards: [card()]});
  });

  it('drops a card of a type this build does not know, and keeps the rest', () => {
    const board = normalizeBoard({version: 1, cards: [card({id: 'x', type: 'from-the-future' as never}), card({id: 'b'})]});
    expect(board!.cards.map(c => c.id)).toEqual(['b']);
  });

  it('drops cards that do not fit the grid or the size rules', () => {
    const cards = [card({id: 'wide', x: 4, w: 3}), card({id: 'odd', h: 6}), card({id: 'ok'}), card({id: 'flat', type: 'divider', h: 1, w: 6}),
      card({id: 'fat-divider', type: 'divider', h: 4, w: 6})];
    expect(normalizeBoard({version: 0, cards})!.cards.map(c => c.id)).toEqual(['ok', 'flat']);
  });

  it('drops a second card with the same id', () => {
    expect(normalizeBoard({version: 0, cards: [card(), card({x: 3})]})!.cards.length).toBe(1);
  });

  it('is null for anything that is not a board, or has no usable card', () => {
    for (const raw of [null, undefined, 5, 'x', {}, {cards: 5}, {version: 1, cards: []}, {version: 1, cards: [card({type: 'x' as never})]}]) {
      expect(normalizeBoard(raw)).toBeNull();
    }
  });

  it('takes a missing or invalid version as 0', () => {
    expect(normalizeBoard({cards: [card()]})!.version).toBe(0);
    expect(normalizeBoard({version: 'x', cards: [card()]})!.version).toBe(0);
  });
});

describe('nextFreePosition', () => {
  it('is the first place below every card, at the left edge', () => {
    expect(nextFreePosition([card({y: 0, h: 12}), card({id: 'b', x: 3, y: 12, h: 8})])).toEqual({x: 0, y: 20});
  });

  it('is the origin on an empty board', () => {
    expect(nextFreePosition([])).toEqual({x: 0, y: 0});
  });
});

describe('readingOrder', () => {
  it('sorts by row, then by column, without changing the list it was given', () => {
    const cards = [card({id: 'late', y: 12}), card({id: 'right', x: 3}), card({id: 'left'})];
    expect(readingOrder(cards).map(c => c.id)).toEqual(['left', 'right', 'late']);
    expect(cards.map(c => c.id)).toEqual(['late', 'right', 'left']);
  });
});
