import {buildPlotModel, PlotModel} from './plot-model';
import {DEFAULT_PLOT, PlotSpec} from './plot-spec';
import {PlotRun} from './plot-transforms';

const run = (id: string, value: number | null, over: Partial<PlotRun> = {}): PlotRun =>
  ({id, name: `run ${id}`, status: 'completed', created: `2026-11-0${id}T10:00:00+00:00`, value, params: {}, ...over});
const scalar = (over: Partial<PlotSpec> = {}): PlotSpec =>
  ({...DEFAULT_PLOT, source: {kind: 'scalar', metric: 'loss', variant: 'val'}, view: 'evolution', statistic: 'min', chart: 'line', ...over});
const kindOf = (model: PlotModel) => model.kind;

describe('buildPlotModel', () => {
  const runs = [run('1', 5), run('2', 3), run('3', 4)];

  it('draws the evolution as one series over time', () => {
    const model = buildPlotModel(scalar(), runs, []);
    expect(model).toEqual(jasmine.objectContaining({kind: 'series', xAxis: 'time', bars: false, area: false}));
    expect((model as Extract<PlotModel, {kind: 'series'}>).series[0].points.map(p => p.y)).toEqual([5, 3, 3]);
  });

  it('is bars or an area when the chart says so', () => {
    expect(buildPlotModel(scalar({chart: 'bar'}), runs, [])).toEqual(jasmine.objectContaining({bars: true, area: false}));
    expect(buildPlotModel(scalar({chart: 'area'}), runs, [])).toEqual(jasmine.objectContaining({bars: false, area: true}));
  });

  it('is a single number for the number chart: the last point of the evolution', () => {
    expect(buildPlotModel(scalar({chart: 'number'}), runs, [])).toEqual({kind: 'number', label: 'min of loss / val', value: 3});
  });

  it('counts the runs per day as bars', () => {
    const model = buildPlotModel({...DEFAULT_PLOT}, runs, []) as Extract<PlotModel, {kind: 'series'}>;
    expect(model.bars).toBeTrue();
    expect(model.series[0].points).toEqual([{x: '2026-11-01', y: 1}, {x: '2026-11-02', y: 1}, {x: '2026-11-03', y: 1}]);
  });

  it('draws the distribution as bars on a linear axis, one bar per bin', () => {
    const model = buildPlotModel(scalar({view: 'distribution', chart: 'bar'}), runs, []) as Extract<PlotModel, {kind: 'series'}>;
    expect(model.xAxis).toBe('linear');
    expect(model.series[0].points.reduce((sum, p) => sum + p.y, 0)).toBe(3);
  });

  it('shares the statuses as a donut', () => {
    const model = buildPlotModel({...DEFAULT_PLOT, source: {kind: 'fact', fact: 'status'}, view: 'distribution', chart: 'donut'},
      [run('1', null), run('2', null, {status: 'failed'}), run('3', null)], []);
    expect(model).toEqual({kind: 'donut', slices: [{name: 'completed', quantity: 2}, {name: 'failed', quantity: 1}]});
  });

  it('draws a value against a parameter as a scatter', () => {
    const spec = scalar({view: 'vs-parameter', chart: 'scatter', parameter: {section: 'Args', name: 'lr'}});
    const model = buildPlotModel(spec, [run('1', 5, {params: {'Args/lr': '0.1'}}), run('2', 3, {params: {'Args/lr': 'x'}})], []);
    expect(model).toEqual(jasmine.objectContaining({kind: 'scatter', xLabel: 'Args/lr', yLabel: 'loss / val'}));
    expect((model as Extract<PlotModel, {kind: 'scatter'}>).points.map(p => [p.x, p.y])).toEqual([[0.1, 5]]);
  });

  it('draws the curves it is given on a linear axis, one series each', () => {
    const curves = [{id: '1', name: 'run 1', points: [{x: 0, y: 1}, {x: 1, y: 0.5}]}, {id: '2', name: 'run 2', points: [{x: 0, y: 2}]}];
    const model = buildPlotModel(scalar({view: 'overlay'}), runs, curves) as Extract<PlotModel, {kind: 'series'}>;
    expect(model.xAxis).toBe('linear');
    expect(model.series.map(s => s.name)).toEqual(['run 1', 'run 2']);
  });

  it('is empty when there is nothing to draw', () => {
    expect(kindOf(buildPlotModel(scalar(), [], []))).toBe('empty');
    expect(kindOf(buildPlotModel(scalar(), [run('1', null)], []))).toBe('empty');
    expect(kindOf(buildPlotModel(scalar({view: 'overlay'}), runs, []))).toBe('empty');
    expect(kindOf(buildPlotModel(scalar({view: 'vs-parameter', chart: 'scatter'}), runs, []))).toBe('empty');
  });
});
