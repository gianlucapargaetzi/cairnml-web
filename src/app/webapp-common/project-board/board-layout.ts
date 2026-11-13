import {Board, BoardCard, GRID_COLUMNS, isBoardCardType, MAX_CARD_HEIGHT, SUB_ROWS} from './board.model';

const whole = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value);

/** Whether a card is a card the grid can hold: a known type, whole numbers inside the columns, a size the rules allow. */
function isValidCard(card: unknown): card is BoardCard {
  if (!card || typeof card !== 'object') {
    return false;
  }
  const {id, type, x, y, w, h, settings} = card as Record<string, unknown>;
  if (typeof id !== 'string' || !id || !isBoardCardType(type) || !whole(x) || !whole(y) || !whole(w) || !whole(h)) {
    return false;
  }
  if (x < 0 || y < 0 || w < 1 || x + w > GRID_COLUMNS) {
    return false;
  }
  const heightOk = type === 'divider' ? h === 1 : h >= SUB_ROWS && h <= MAX_CARD_HEIGHT && h % SUB_ROWS === 0;
  return heightOk && (settings === undefined || (typeof settings === 'object' && settings !== null && !Array.isArray(settings)));
}

/**
 * A board from whatever was stored: cards this build cannot show (an unknown type from a newer version, a place outside the grid, a
 * repeated id) are dropped and the rest is kept. `null` when it is not a board or nothing usable is left, so the page falls back
 * to the default board.
 */
export function normalizeBoard(raw: unknown): Board | null {
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as {cards?: unknown}).cards)) {
    return null;
  }
  const {version, cards} = raw as {version?: unknown; cards: unknown[]};
  const seen = new Set<string>();
  const kept: BoardCard[] = [];
  for (const candidate of cards) {
    if (isValidCard(candidate) && !seen.has(candidate.id)) {
      seen.add(candidate.id);
      kept.push({...candidate, settings: candidate.settings ?? {}});
    }
  }
  return kept.length ? {version: whole(version) && version >= 0 ? version : 0, cards: kept} : null;
}

/** The place for a new card: the first row below every card, at the left edge. */
export function nextFreePosition(cards: BoardCard[]): {x: number; y: number} {
  return {x: 0, y: cards.reduce((bottom, card) => Math.max(bottom, card.y + card.h), 0)};
}

/** The cards in the order they are read: row by row, left to right. A new array; the given one is not changed. */
export function readingOrder(cards: BoardCard[]): BoardCard[] {
  return [...cards].sort((a, b) => a.y - b.y || a.x - b.x);
}
