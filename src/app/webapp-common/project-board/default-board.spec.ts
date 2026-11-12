import {defaultBoard} from './default-board';
import {normalizeBoard} from './board-layout';
import {GRID_COLUMNS} from './board.model';

describe('defaultBoard', () => {
  it('is the content of the overview as five cards at fixed places', () => {
    const board = defaultBoard();
    expect(board.version).toBe(0);
    expect(board.cards.map(card => [card.id, card.type, card.x, card.y, card.w, card.h])).toEqual([
      ['project-state', 'project-state', 0, 0, 3, 12],
      ['contributions', 'contributions', 3, 0, 3, 12],
      ['metric-snapshot', 'metric-snapshot', 0, 12, 6, 12],
      ['recent-tasks', 'recent-tasks', 0, 24, 6, 16],
      ['description', 'description', 0, 40, 6, 16],
    ]);
    expect(board.cards[1].settings).toEqual({periodDays: 365, topContributors: 5});
  });

  it('fits the grid, has no overlapping cards and is valid as it is', () => {
    const {cards} = defaultBoard();
    cards.forEach(card => expect(card.x + card.w).toBeLessThanOrEqual(GRID_COLUMNS));
    for (const a of cards) {
      for (const b of cards.filter(other => other !== a)) {
        const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
        expect(apart).withContext(`${a.id} and ${b.id}`).toBeTrue();
      }
    }
    expect(normalizeBoard(defaultBoard())).toEqual(defaultBoard());
  });

  it('returns a new board every time, so an edit never changes the default', () => {
    const first = defaultBoard();
    first.cards[0].x = 5;
    expect(defaultBoard().cards[0].x).toBe(0);
  });
});
