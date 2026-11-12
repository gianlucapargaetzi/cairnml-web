import {PlotSource, PlotSpec} from './plot-spec';
import {distribution, evolution, numericValue, runsPerDay, statusCounts, PlotRun} from './plot-transforms';

/** A curve of one run: the value of a scalar at every reported iteration. */
export interface PlotCurve {
  id: string;
  name: string;
  points: {x: number; y: number}[];
}

/** What a plot card draws. One shape for each way of drawing, so the card only has to match on `kind`. */
export type PlotModel =
  | {kind: 'empty'}
  | {kind: 'number'; label: string; value: number}
  | {kind: 'series'; xAxis: 'time' | 'linear'; bars: boolean; area: boolean; yLabel?: string; series: {name: string; points: {x: string; y: number}[]}[]}
  | {kind: 'donut'; slices: {name: string; quantity: number}[]}
  | {kind: 'scatter'; xLabel: string; yLabel: string; points: {id: string; name: string; x: number; y: number}[]};

const BINS = 10;
const EMPTY: PlotModel = {kind: 'empty'};

/** A short name for what is plotted: `loss / val`, `Args/lr`, `duration`. */
export function sourceLabel(source: PlotSource): string {
  switch (source.kind) {
    case 'scalar': return `${source.metric} / ${source.variant}`;
    case 'metadata': return `${source.section}/${source.name}`;
    case 'fact': return source.fact === 'runs-per-day' ? 'runs per day' : source.fact;
  }
}

const statisticLabel = {'avg': 'average', 'min': 'min', 'max': 'max', 'best-so-far': 'best so far', 'last': 'last'} as const;

/**
 * The picture a spec makes of its runs (and, for the curve views, of the curves of some of them). Nothing to draw gives `empty`:
 * a spec that points at a metric the runs no longer have is an empty card, not an error.
 */
export function buildPlotModel(spec: PlotSpec, runs: PlotRun[], curves: PlotCurve[]): PlotModel {
  const label = sourceLabel(spec.source);
  const area = spec.chart === 'area';
  const bars = spec.chart === 'bar';

  if (spec.source.kind === 'fact' && spec.source.fact === 'status' && spec.view === 'distribution') {
    const slices = statusCounts(runs).map(({label: name, count}) => ({name, quantity: count}));
    return slices.length ? {kind: 'donut', slices} : EMPTY;
  }
  if (spec.source.kind === 'fact' && spec.source.fact === 'runs-per-day') {
    const points = runsPerDay(runs);
    return points.length ? {kind: 'series', xAxis: 'time', bars, area, yLabel: 'Runs', series: [{name: 'Runs per day', points}]} : EMPTY;
  }

  switch (spec.view) {
    case 'evolution': {
      const points = evolution(runs, spec.statistic, spec.goal);
      const name = `${statisticLabel[spec.statistic]} of ${label}`;
      if (!points.length) {
        return EMPTY;
      }
      return spec.chart === 'number'
        ? {kind: 'number', label: name, value: points[points.length - 1].y}
        : {kind: 'series', xAxis: 'time', bars, area, yLabel: label, series: [{name, points}]};
    }
    case 'distribution': {
      const bins = distribution(runs, BINS);
      return bins.length
        ? {kind: 'series', xAxis: 'linear', bars: true, area: false, yLabel: 'Runs',
          series: [{name: `Runs by ${label}`, points: bins.map(bin => ({x: String((bin.from + bin.to) / 2), y: bin.count}))}]}
        : EMPTY;
    }
    case 'vs-parameter': {
      const key = spec.parameter ? `${spec.parameter.section}/${spec.parameter.name}` : '';
      const points = runs.flatMap(run => {
        const x = numericValue(run.params[key]);
        return key && x !== null && run.value !== null ? [{id: run.id, name: run.name, x, y: run.value}] : [];
      });
      return points.length ? {kind: 'scatter', xLabel: key, yLabel: label, points} : EMPTY;
    }
    default: {
      const drawn = curves.filter(curve => curve.points.length);
      return drawn.length
        ? {kind: 'series', xAxis: 'linear', bars: false, area, yLabel: label,
          series: drawn.map(curve => ({name: curve.name, points: curve.points.map(p => ({x: String(p.x), y: p.y}))}))}
        : EMPTY;
    }
  }
}

const viewTitle = {'best-run-curve': 'best run', 'last-run-curve': 'last run', 'overlay': 'newest runs'} as const;

/** The title of a plot card: what is plotted, in a few words. */
export function plotTitle(spec: PlotSpec): string {
  const label = sourceLabel(spec.source);
  switch (spec.view) {
    case 'evolution': return spec.source.kind === 'fact' && spec.source.fact === 'runs-per-day' ? 'Runs per day' : `${statisticLabel[spec.statistic]} of ${label}`;
    case 'distribution': return `${label}, distribution`;
    case 'vs-parameter': return `${label} by ${spec.parameter ? `${spec.parameter.section}/${spec.parameter.name}` : 'a parameter'}`;
    default: return `${label}, ${viewTitle[spec.view]}`;
  }
}
