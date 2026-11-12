/**
 * Column widths that fit the content.
 *
 * Every column gets the width of its widest content (the natural width). When the natural widths together are narrower
 * than the panel, the free pixels are shared in proportion to them: a column that has 20% of the content gets 20% of the
 * free space. When they are wider than the panel, the columns collapse (their text is cut with an ellipsis) in the
 * order of `collapseOrder`: every column of order 1 first, then order 2, and so on. A column never collapses below its
 * floor, the width of its header, so the label is always readable. Fixed columns (the row actions, a checkbox) keep their
 * natural width. When even the floors do not fit, the table scrolls sideways.
 */
export interface FitColumn {
  id: string;
  /** The width of the widest content, header included. */
  natural: number;
  /** The width of the header: the column never gets narrower than this. */
  floor: number;
  /** 1 collapses first, larger numbers later. Columns of the same order collapse together. */
  order: number;
  /** A fixed column keeps its natural width, whatever the panel width. */
  fixed?: boolean;
}

export const DEFAULT_COLLAPSE_ORDER = 5;

export function fitColumnWidths(columns: FitColumn[], available: number): Record<string, number> {
  const widths: Record<string, number> = {};
  columns.forEach(col => widths[col.id] = Math.max(col.natural, 0));
  const total = columns.reduce((sum, col) => sum + widths[col.id], 0);
  const flexible = columns.filter(col => !col.fixed);

  if (total <= available) {
    const flexibleTotal = flexible.reduce((sum, col) => sum + widths[col.id], 0);
    const free = available - total;
    if (flexibleTotal > 0) {
      flexible.forEach(col => widths[col.id] += free * widths[col.id] / flexibleTotal);
    }
    return widths;
  }

  let deficit = total - available;
  const orders = [...new Set(flexible.map(col => col.order))].sort((a, b) => a - b);
  for (const order of orders) {
    if (deficit <= 0) {
      break;
    }
    const group = flexible.filter(col => col.order === order);
    const slack = group.reduce((sum, col) => sum + Math.max(widths[col.id] - Math.min(col.floor, col.natural), 0), 0);
    if (slack <= 0) {
      continue;
    }
    const take = Math.min(deficit, slack);
    group.forEach(col => {
      const own = Math.max(widths[col.id] - Math.min(col.floor, col.natural), 0);
      widths[col.id] -= take * own / slack;
    });
    deficit -= take;
  }
  return widths;
}

export function sumWidths(widths: Record<string, number>): number {
  return Object.values(widths).reduce((sum, width) => sum + width, 0);
}
