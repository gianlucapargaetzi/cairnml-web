import {BoardCard, GRID_COLUMNS, MAX_CARD_HEIGHT, SUB_ROWS} from '../board.model';

export interface GridNodeLike {
  id?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

/** What the grid needs to know about a card: where it is and how large. */
export const toGridNode = (card: BoardCard): Required<GridNodeLike> => ({id: card.id, x: card.x, y: card.y, w: card.w, h: card.h});

const isDivider = (card: Pick<BoardCard, 'type'>) => card.type === 'divider';

/** A height the rules allow: a divider stays one row, a card is a whole number of tiles (the nearest one, at least one). */
function snapHeight(card: Pick<BoardCard, 'type'>, h: number): number {
  if (isDivider(card)) {
    return 1;
  }
  return Math.min(MAX_CARD_HEIGHT, Math.max(SUB_ROWS, Math.round(h / SUB_ROWS) * SUB_ROWS));
}

/**
 * The cards with the geometry the grid reports. Only `x`, `y`, `w` and `h` change: type and settings stay as they were. The order of
 * `previous` is kept, a node that is not a card is ignored and a card without a node is left as it is.
 */
export function fromGridNodes(nodes: GridNodeLike[], previous: BoardCard[]): BoardCard[] {
  const byId = new Map(nodes.filter(node => node.id).map(node => [node.id as string, node] as const));
  return previous.map(card => {
    const node = byId.get(card.id);
    if (!node) {
      return card;
    }
    const w = Math.min(GRID_COLUMNS, Math.max(1, node.w ?? card.w));
    const x = Math.min(GRID_COLUMNS - w, Math.max(0, node.x ?? card.x));
    return {...card, x, y: Math.max(0, node.y ?? card.y), w, h: snapHeight(card, node.h ?? card.h)};
  });
}

/**
 * What an arrow key does to a card in edit mode: the arrows move it one tile (a divider one row down or up), shift and an arrow
 * make it one tile wider or narrower, taller or shorter. `null` when the key does nothing (another key, the edge of the grid, a
 * divider that cannot grow).
 */
export function keyStep(card: BoardCard, key: string, shift: boolean): Partial<Pick<BoardCard, 'x' | 'y' | 'w' | 'h'>> | null {
  const rows = isDivider(card) ? 1 : SUB_ROWS;
  if (!shift) {
    switch (key) {
      case 'ArrowLeft': return card.x > 0 ? {x: card.x - 1} : null;
      case 'ArrowRight': return card.x + card.w < GRID_COLUMNS ? {x: card.x + 1} : null;
      case 'ArrowUp': return card.y > 0 ? {y: Math.max(0, card.y - rows)} : null;
      case 'ArrowDown': return {y: card.y + rows};
      default: return null;
    }
  }
  switch (key) {
    case 'ArrowLeft': return card.w > 1 ? {w: card.w - 1} : null;
    case 'ArrowRight': return card.x + card.w < GRID_COLUMNS ? {w: card.w + 1} : null;
    case 'ArrowUp': return !isDivider(card) && card.h > SUB_ROWS ? {h: card.h - SUB_ROWS} : null;
    case 'ArrowDown': return !isDivider(card) && card.h < MAX_CARD_HEIGHT ? {h: card.h + SUB_ROWS} : null;
    default: return null;
  }
}
