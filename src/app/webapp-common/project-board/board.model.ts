/**
 * The overview board of a project: one shared layout of cards on a grid.
 *
 * The grid has 6 columns and its rows are quarter tiles: a tile is one column wide and, since tiles are square, as high as it is
 * wide; a row is a quarter of that. `x` and `w` count columns, `y` and `h` count rows. A card is a whole number of tiles high (`h` a
 * multiple of `SUB_ROWS`); a divider is one row high, a thin card. The server checks the same rules (bll/project/overview_board.py).
 */
export const GRID_COLUMNS = 6;
export const SUB_ROWS = 4;
export const MAX_CARD_HEIGHT = 48;

export const BOARD_CARD_TYPES = [
  'project-state', 'recent-tasks', 'metric-snapshot', 'contributions', 'description',
  'plot', 'dataset-content', 'agents', 'repositories', 'progress', 'divider',
] as const;

export type BoardCardType = typeof BOARD_CARD_TYPES[number];

export interface BoardCard {
  id: string;
  type: BoardCardType;
  x: number;
  y: number;
  w: number;
  h: number;
  settings: Record<string, unknown>;
}

export interface Board {
  /** How many times the board was saved: a save names the version it was made from. 0 for a board that was never saved. */
  version: number;
  cards: BoardCard[];
}

export const isBoardCardType = (value: unknown): value is BoardCardType =>
  (BOARD_CARD_TYPES as readonly unknown[]).includes(value);
