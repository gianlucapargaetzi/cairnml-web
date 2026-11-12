import {fitColumnWidths, FitColumn} from './fit-columns';

const col = (id: string, natural: number, floor: number, order = 5, fixed = false): FitColumn => ({id, natural, floor, order, fixed});
const sum = (widths: Record<string, number>) => Object.values(widths).reduce((a, b) => a + b, 0);

describe('fitColumnWidths', () => {
  it('shares the free space in proportion to the natural widths', () => {
    const widths = fitColumnWidths([col('a', 100, 40), col('b', 300, 40)], 800);
    expect(widths['a']).toBeCloseTo(200);
    expect(widths['b']).toBeCloseTo(600);
  });

  it('keeps a fixed column at its natural width and gives the free space to the others', () => {
    const widths = fitColumnWidths([col('a', 100, 40), col('actions', 60, 60, 5, true)], 500);
    expect(widths['actions']).toBe(60);
    expect(widths['a']).toBeCloseTo(440);
  });

  it('collapses the columns of the lowest order first, and not below their header', () => {
    const columns = [col('id', 100, 30, 1), col('type', 100, 50, 2), col('name', 200, 60, 9)];
    expect(fitColumnWidths(columns, 350)).toEqual({id: 50, type: 100, name: 200});
    const narrower = fitColumnWidths(columns, 300);
    expect(narrower['id']).toBe(30);
    expect(narrower['type']).toBeCloseTo(70);
    expect(narrower['name']).toBe(200);
  });

  it('collapses the last column only when the others are at their headers', () => {
    const widths = fitColumnWidths([col('id', 100, 30, 1), col('name', 200, 60, 9)], 150);
    expect(widths['id']).toBe(30);
    expect(widths['name']).toBeCloseTo(120);
  });

  it('collapses columns of the same order together, in proportion to what they can give', () => {
    const widths = fitColumnWidths([col('a', 100, 50, 1), col('b', 200, 50, 1), col('name', 100, 100, 9)], 350);
    expect(widths['a']).toBeCloseTo(100 - 50 * 50 / 200);
    expect(widths['b']).toBeCloseTo(200 - 50 * 150 / 200);
  });

  it('stops at the headers when they do not fit: the table scrolls', () => {
    const widths = fitColumnWidths([col('a', 100, 80, 1), col('b', 100, 80, 2)], 100);
    expect(widths).toEqual({a: 80, b: 80});
    expect(sum(widths)).toBeGreaterThan(100);
  });
});
