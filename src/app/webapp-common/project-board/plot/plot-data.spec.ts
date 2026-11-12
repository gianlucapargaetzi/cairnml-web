import {DEFAULT_PLOT, PlotSpec} from './plot-spec';
import {taskQuery, taskToPlotRun} from './plot-data';
import {MAX_RUNS} from './plot-transforms';

const scalar = (over: Partial<PlotSpec> = {}): PlotSpec => ({...DEFAULT_PLOT, source: {kind: 'scalar', metric: 'loss', variant: 'val'}, view: 'evolution', chart: 'line', ...over});

const task = {
  id: 't1', name: 'baseline', status: 'completed', created: '2026-11-01T10:00:00+00:00', active_duration: 90,
  last_metrics: {m1: {v1: {metric: 'loss', variant: 'val', value: 0.4, min_value: 0.1, max_value: 0.9}, v2: {metric: 'loss', variant: 'train', value: 0.2}}},
  hyperparams: {Args: {lr: {value: '0.01'}, name: {value: 'fast'}}},
};

describe('taskToPlotRun', () => {
  it('takes the value of the chosen scalar: its last, minimum or maximum', () => {
    expect(taskToPlotRun(task, scalar({runValue: 'last'})).value).toBe(0.4);
    expect(taskToPlotRun(task, scalar({runValue: 'min'})).value).toBe(0.1);
    expect(taskToPlotRun(task, scalar({runValue: 'max'})).value).toBe(0.9);
  });

  it('has no value when the run never reported that scalar', () => {
    expect(taskToPlotRun({...task, last_metrics: undefined}, scalar()).value).toBeNull();
    expect(taskToPlotRun(task, scalar({source: {kind: 'scalar', metric: 'loss', variant: 'gone'}})).value).toBeNull();
  });

  it('takes a parameter as the value, when it is a number', () => {
    expect(taskToPlotRun(task, {...scalar(), source: {kind: 'metadata', section: 'Args', name: 'lr'}}).value).toBe(0.01);
    expect(taskToPlotRun(task, {...scalar(), source: {kind: 'metadata', section: 'Args', name: 'name'}}).value).toBeNull();
  });

  it('takes the duration of the run, in seconds', () => {
    expect(taskToPlotRun(task, {...scalar(), source: {kind: 'fact', fact: 'duration'}}).value).toBe(90);
  });

  it('keeps the parameter of a plot against a parameter', () => {
    const run = taskToPlotRun(task, scalar({view: 'vs-parameter', chart: 'scatter', parameter: {section: 'Args', name: 'lr'}}));
    expect(run.params).toEqual({'Args/lr': '0.01'});
  });

  it('carries what every plot needs of a run', () => {
    expect(taskToPlotRun(task, scalar())).toEqual(jasmine.objectContaining({id: 't1', name: 'baseline', status: 'completed', created: task.created}));
  });
});

describe('taskQuery', () => {
  it('reads the newest runs of the project, never more than the cap, without archived ones', () => {
    const query = taskQuery('p1', scalar());
    expect(query.project).toEqual(['p1']);
    expect(query.page_size).toBe(MAX_RUNS);
    expect(query.order_by).toEqual(['-created']);
    expect(query.system_tags).toEqual(['-archived']);
  });

  it('asks for the fields the plot needs and no more', () => {
    expect(taskQuery('p1', scalar()).only_fields).toEqual(['id', 'name', 'status', 'created', 'started', 'active_duration', 'last_metrics']);
    const withParameter = taskQuery('p1', scalar({view: 'vs-parameter', chart: 'scatter', parameter: {section: 'Args', name: 'lr'}}));
    expect(withParameter.only_fields).toContain('hyperparams.Args.lr');
  });

  it('selects the runs of one task by the exact task name, and a set of runs by id', () => {
    expect(taskQuery('p1', scalar({runs: {scope: 'task', task: 'baseline (v2)'}})).name).toBe('^baseline \\(v2\\)$');
    expect(taskQuery('p1', scalar({runs: {scope: 'set', ids: ['a', 'b']}})).id).toEqual(['a', 'b']);
    expect(taskQuery('p1', scalar()).name).toBeUndefined();
  });
});
