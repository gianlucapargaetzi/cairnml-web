import {allowedCharts, allowedViews, DEFAULT_PLOT, normalizePlotSettings, PlotSpec} from './plot-spec';
import {bestRun, distribution, evolution, lastRun, numericValue, PlotRun, runsPerDay, statusCounts, versusParameter} from './plot-transforms';

const run = (id: string, value: number | null, over: Partial<PlotRun> = {}): PlotRun =>
  ({id, name: 'run', status: 'completed', created: `2026-11-0${id}T10:00:00+00:00`, value, params: {}, ...over});

describe('evolution', () => {
  const runs = [run('1', 5), run('2', 3), run('3', 4)];

  it('is the minimum, average and maximum over the runs so far', () => {
    expect(evolution(runs, 'min', 'min').map(p => p.y)).toEqual([5, 3, 3]);
    expect(evolution(runs, 'avg', 'min').map(p => p.y)).toEqual([5, 4, 4]);
    expect(evolution(runs, 'max', 'min').map(p => p.y)).toEqual([5, 5, 5]);
    expect(evolution(runs, 'last', 'min').map(p => p.y)).toEqual([5, 3, 4]);
  });

  it('best-so-far follows the goal', () => {
    expect(evolution(runs, 'best-so-far', 'min').map(p => p.y)).toEqual([5, 3, 3]);
    expect(evolution(runs, 'best-so-far', 'max').map(p => p.y)).toEqual([5, 5, 5]);
  });

  it('is in creation order whatever the order it was given', () => {
    expect(evolution([runs[2], runs[0], runs[1]], 'last', 'min').map(p => p.y)).toEqual([5, 3, 4]);
  });

  it('has no point for a run without a value', () => {
    expect(evolution([run('1', 5), run('2', null), run('3', 4)], 'min', 'min').map(p => p.y)).toEqual([5, 4]);
  });

  it('is empty for no runs and for runs without values', () => {
    expect(evolution([], 'min', 'min')).toEqual([]);
    expect(evolution([run('1', null)], 'avg', 'min')).toEqual([]);
  });
});

describe('bestRun and lastRun', () => {
  it('finds the best run by the goal and ignores runs without a value', () => {
    const runs = [run('1', 5), run('2', null), run('3', 2), run('4', 9)];
    expect(bestRun(runs, 'min')?.id).toBe('3');
    expect(bestRun(runs, 'max')?.id).toBe('4');
    expect(bestRun([run('1', null)], 'min')).toBeNull();
    expect(bestRun([], 'min')).toBeNull();
  });

  it('the last run is the newest one that has a value', () => {
    expect(lastRun([run('1', 5), run('3', 2), run('2', 7), run('4', null)])?.id).toBe('3');
    expect(lastRun([])).toBeNull();
  });
});

describe('distribution', () => {
  it('puts every value in exactly one bin', () => {
    const values = [1, 1.5, 2, 2.5, 3, 10];
    const bins = distribution(values.map((v, i) => run(String(i), v)), 4);
    expect(bins.length).toBe(4);
    expect(bins.reduce((sum, bin) => sum + bin.count, 0)).toBe(values.length);
    expect(bins[0].from).toBe(1);
    expect(bins[3].to).toBe(10);
  });

  it('is one bin for values that are all the same, and empty for none', () => {
    expect(distribution([run('1', 3), run('2', 3)], 5)).toEqual([{from: 3, to: 3, count: 2}]);
    expect(distribution([run('1', null)], 5)).toEqual([]);
  });
});

describe('versusParameter, runsPerDay, statusCounts', () => {
  it('pairs the parameter with the value, for runs that have both', () => {
    const runs = [run('1', 5, {params: {'Args/lr': '0.1'}}), run('2', 3, {params: {'Args/lr': 'fast'}}), run('3', null, {params: {'Args/lr': 0.2}}),
      run('4', 2, {params: {'Args/lr': 0.01}})];
    expect(versusParameter(runs, 'Args/lr')).toEqual([{x: 0.1, y: 5}, {x: 0.01, y: 2}]);
  });

  it('counts the runs of every day, oldest first', () => {
    const runs = [run('1', 1), run('1', 1, {id: 'x'}), run('2', 1)];
    expect(runsPerDay(runs)).toEqual([{x: '2026-11-01', y: 2}, {x: '2026-11-02', y: 1}]);
  });

  it('counts the runs of every status', () => {
    expect(statusCounts([run('1', 1), run('2', 1, {status: 'failed'}), run('3', 1)])).toEqual([{label: 'completed', count: 2}, {label: 'failed', count: 1}]);
  });

  it('reads a number from a number or a numeric string, and nothing else', () => {
    expect(numericValue(3)).toBe(3);
    expect(numericValue('0.5')).toBe(0.5);
    expect(numericValue('fast')).toBeNull();
    expect(numericValue('')).toBeNull();
    expect(numericValue(undefined)).toBeNull();
  });
});

describe('plot settings', () => {
  it('only offers the charts that suit the data', () => {
    const base = DEFAULT_PLOT;
    expect(allowedCharts({...base, source: {kind: 'fact', fact: 'status'}, view: 'distribution'})).toContain('donut');
    expect(allowedCharts({...base, source: {kind: 'scalar', metric: 'loss', variant: 'val'}, view: 'evolution'})).not.toContain('donut');
    expect(allowedCharts({...base, source: {kind: 'scalar', metric: 'loss', variant: 'val'}, view: 'vs-parameter'})).toEqual(['scatter']);
  });

  it('only offers the views a source has', () => {
    expect(allowedViews({kind: 'fact', fact: 'status'})).toEqual(['distribution']);
    expect(allowedViews({kind: 'fact', fact: 'runs-per-day'})).toEqual(['evolution']);
    expect(allowedViews({kind: 'scalar', metric: 'loss', variant: 'val'}).length).toBe(6);
  });

  it('turns anything into valid settings, keeping what is valid', () => {
    expect(normalizePlotSettings(null)).toEqual(DEFAULT_PLOT);
    expect(normalizePlotSettings('x')).toEqual(DEFAULT_PLOT);
    const kept = normalizePlotSettings({source: {kind: 'scalar', metric: 'loss', variant: 'val'}, view: 'evolution', statistic: 'min', chart: 'line', goal: 'min'});
    expect(kept.source).toEqual({kind: 'scalar', metric: 'loss', variant: 'val'});
    expect(kept.statistic).toBe('min');
  });

  it('replaces a chart that does not suit the view by the first one that does', () => {
    const fixed: PlotSpec = normalizePlotSettings({source: {kind: 'scalar', metric: 'loss', variant: 'val'}, view: 'vs-parameter', chart: 'donut',
      parameter: {section: 'Args', name: 'lr'}});
    expect(fixed.chart).toBe('scatter');
  });

  it('replaces a view the source does not have', () => {
    expect(normalizePlotSettings({source: {kind: 'fact', fact: 'status'}, view: 'overlay', chart: 'line'}).view).toBe('distribution');
  });
});
