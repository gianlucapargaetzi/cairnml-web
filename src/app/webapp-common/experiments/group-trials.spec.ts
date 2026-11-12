import {groupTrials} from './group-trials';

const task = (id: string, type = 'training', parent?: string | {id: string}) => ({id, type, parent});

describe('groupTrials', () => {
  it('puts the trials under their search and keeps the order of the others', () => {
    const rows = groupTrials([task('a'), task('t1', 'training', 's'), task('s', 'optimizer'), task('t2', 'training', 's'), task('b')], new Set());
    expect(rows.map(row => row.id)).toEqual(['a', 's', 't1', 't2', 'b']);
    expect(rows[1].groupChildren).toBe(2);
    expect(rows[1].groupExpanded).toBeTrue();
    expect(rows[2].groupLevel).toBe(1);
    expect(rows[0].groupLevel).toBeUndefined();
  });

  it('hides the trials of a collapsed search', () => {
    const rows = groupTrials([task('s', 'optimizer'), task('t1', 'training', 's')], new Set(['s']));
    expect(rows.map(row => row.id)).toEqual(['s']);
    expect(rows[0].groupExpanded).toBeFalse();
    expect(rows[0].groupChildren).toBe(1);
  });

  it('keeps a trial whose search is not loaded as a row of its own', () => {
    const rows = groupTrials([task('t1', 'training', 'missing'), task('a')], new Set());
    expect(rows.map(row => row.id)).toEqual(['t1', 'a']);
    expect(rows[0].groupLevel).toBeUndefined();
  });

  it('reads the parent as an id or as an object, and ignores a parent that is not a search', () => {
    const rows = groupTrials([task('s', 'optimizer'), task('t1', 'training', {id: 's'}), task('x', 'training', 'a'), task('a')], new Set());
    expect(rows.map(row => row.id)).toEqual(['s', 't1', 'x', 'a']);
    expect(rows[1].groupLevel).toBe(1);
    expect(rows[2].groupLevel).toBeUndefined();
  });

  it('leaves a list without searches as it is', () => {
    const list = [task('a'), task('b')];
    expect(groupTrials(list, new Set())).toBe(list);
  });
});
