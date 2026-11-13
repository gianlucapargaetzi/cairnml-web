import {computeProgress, progressSettings, ProgressRun} from './progress';

const runs = (values: (number | null)[], statuses: string[] = []): ProgressRun[] =>
  values.map((value, i) => ({created: `2026-11-${String(i + 1).padStart(2, '0')}T10:00:00+00:00`, status: statuses[i] ?? 'completed', value}));

describe('computeProgress', () => {
  it('counts the runs since the last improvement of the best value', () => {
    expect(computeProgress(runs([5, 4, 4, 6, 3.9, 4.5]), 'min')).toEqual(jasmine.objectContaining({best: 3.9, runs: 6, runsSinceImprovement: 1}));
  });

  it('a run that ties the best is not an improvement', () => {
    expect(computeProgress(runs([5, 4, 4, 4]), 'min').runsSinceImprovement).toBe(2);
  });

  it('follows the goal', () => {
    expect(computeProgress(runs([1, 2, 2, 2]), 'max')).toEqual(jasmine.objectContaining({best: 2, runsSinceImprovement: 2}));
  });

  it('counts runs without a value as runs, but never as an improvement or a miss of one', () => {
    const result = computeProgress(runs([5, null, 4, null, null]), 'min');
    expect(result.runs).toBe(5);
    expect(result.best).toBe(4);
    expect(result.runsSinceImprovement).toBe(0);
  });

  it('puts the runs in creation order whatever the order it was given', () => {
    expect(computeProgress([...runs([5, 4, 6, 7])].reverse(), 'min')).toEqual(jasmine.objectContaining({best: 4, runsSinceImprovement: 2}));
  });

  it('counts the failed runs and their share, without dividing by zero', () => {
    const result = computeProgress(runs([1, 2, 3, 4], ['failed', 'completed', 'failed', 'completed']), 'min');
    expect(result.failed).toBe(2);
    expect(result.failureRate).toBe(0.5);
    expect(computeProgress([], 'min')).toEqual({best: null, runs: 0, failed: 0, failureRate: 0, runsSinceImprovement: 0});
  });
});

describe('progressSettings', () => {
  it('keeps valid settings and falls back to the default for the rest', () => {
    expect(progressSettings({task: 'baseline', metric: {metric: 'loss', variant: 'val'}, goal: 'max'}))
      .toEqual({task: 'baseline', metric: {metric: 'loss', variant: 'val'}, goal: 'max'});
    expect(progressSettings(undefined)).toEqual({task: null, metric: null, goal: 'min'});
    expect(progressSettings({task: 5, metric: {metric: 'loss'}, goal: 'sideways'})).toEqual({task: null, metric: null, goal: 'min'});
  });
});
