/**
 * What a plot card shows, as the owner set it up: a source (a scalar of the runs, a parameter, a fact about the runs), which runs, what to
 * show of them and how to draw it. Anything stored is turned into a valid spec by `normalizePlotSettings`, so an old or damaged board
 * never breaks a card.
 */
export type PlotSource =
  | {kind: 'scalar'; metric: string; variant: string}
  | {kind: 'metadata'; section: string; name: string}
  | {kind: 'fact'; fact: 'duration' | 'status' | 'runs-per-day'};

export type PlotRuns = {scope: 'project'} | {scope: 'task'; task: string} | {scope: 'set'; ids: string[]};

export const PLOT_VIEWS = ['evolution', 'best-run-curve', 'last-run-curve', 'overlay', 'distribution', 'vs-parameter'] as const;
export type PlotView = typeof PLOT_VIEWS[number];

export const PLOT_STATISTICS = ['avg', 'min', 'max', 'best-so-far', 'last'] as const;
export type PlotStatistic = typeof PLOT_STATISTICS[number];

export const PLOT_CHARTS = ['line', 'bar', 'area', 'scatter', 'donut', 'number'] as const;
export type PlotChart = typeof PLOT_CHARTS[number];

export type RunValue = 'last' | 'min' | 'max';

export interface PlotSpec {
  source: PlotSource;
  /** Which runs are plotted. For a task: all runs with that task name (never the display name). */
  runs: PlotRuns;
  view: PlotView;
  /** For `evolution`: what is drawn over the runs so far. */
  statistic: PlotStatistic;
  /** For a scalar: which value of a run's curve is the run's value. */
  runValue: RunValue;
  /** Which direction is better, for the best run and best-so-far. */
  goal: 'min' | 'max';
  chart: PlotChart;
  /** For `vs-parameter`: the parameter on the x axis. */
  parameter?: {section: string; name: string};
}

/** The plot a new card shows: the number of runs per day, which needs no choice and always has something to show. */
export const DEFAULT_PLOT: PlotSpec = {
  source: {kind: 'fact', fact: 'runs-per-day'}, runs: {scope: 'project'}, view: 'evolution', statistic: 'last', runValue: 'last', goal: 'min', chart: 'bar',
};

/** The views a source has. A fact has fewer: runs per day is a series, a status is a distribution. */
export function allowedViews(source: PlotSource): PlotView[] {
  if (source.kind === 'fact') {
    return source.fact === 'status' ? ['distribution'] : source.fact === 'runs-per-day' ? ['evolution'] : ['evolution', 'distribution'];
  }
  if (source.kind === 'metadata') {
    return ['evolution', 'distribution'];
  }
  return [...PLOT_VIEWS];
}

/** The charts that suit what is shown: a donut is a share of a whole (the statuses, and only those), a scatter is a value against a parameter. */
export function allowedCharts(spec: Pick<PlotSpec, 'source' | 'view'>): PlotChart[] {
  switch (spec.view) {
    case 'evolution': return ['line', 'area', 'bar', 'number'];
    case 'best-run-curve':
    case 'last-run-curve':
    case 'overlay': return ['line', 'area'];
    case 'distribution': return spec.source.kind === 'fact' && spec.source.fact === 'status' ? ['donut'] : ['bar'];
    case 'vs-parameter': return ['scatter'];
  }
}

const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const isOne = <T extends string>(list: readonly T[], value: unknown): value is T => (list as readonly unknown[]).includes(value);

function normalizeSource(raw: unknown): PlotSource {
  const source = raw as Record<string, unknown> | null;
  if (source?.['kind'] === 'scalar' && text(source['metric']) && text(source['variant'])) {
    return {kind: 'scalar', metric: source['metric'] as string, variant: source['variant'] as string};
  }
  if (source?.['kind'] === 'metadata' && text(source['section']) && text(source['name'])) {
    return {kind: 'metadata', section: source['section'] as string, name: source['name'] as string};
  }
  if (source?.['kind'] === 'fact' && isOne(['duration', 'status', 'runs-per-day'] as const, source['fact'])) {
    return {kind: 'fact', fact: source['fact']};
  }
  return DEFAULT_PLOT.source;
}

function normalizeRuns(raw: unknown): PlotRuns {
  const runs = raw as Record<string, unknown> | null;
  if (runs?.['scope'] === 'task' && text(runs['task'])) {
    return {scope: 'task', task: runs['task'] as string};
  }
  if (runs?.['scope'] === 'set' && Array.isArray(runs['ids']) && runs['ids'].every(text)) {
    return {scope: 'set', ids: runs['ids'] as string[]};
  }
  return {scope: 'project'};
}

/** A valid spec from whatever was stored: what is valid is kept, the rest is replaced by the default, and the view and chart are
 *  brought in line with what the source and the view allow. */
export function normalizePlotSettings(raw: unknown): PlotSpec {
  if (!raw || typeof raw !== 'object') {
    return {...DEFAULT_PLOT};
  }
  const settings = raw as Record<string, unknown>;
  const source = normalizeSource(settings['source']);
  const views = allowedViews(source);
  const view = isOne(PLOT_VIEWS, settings['view']) && views.includes(settings['view']) ? settings['view'] : views[0];
  const charts = allowedCharts({source, view});
  const chart = isOne(PLOT_CHARTS, settings['chart']) && charts.includes(settings['chart']) ? settings['chart'] : charts[0];
  const parameter = settings['parameter'] as {section?: unknown; name?: unknown} | undefined;
  return {
    source, runs: normalizeRuns(settings['runs']), view,
    statistic: isOne(PLOT_STATISTICS, settings['statistic']) ? settings['statistic'] : DEFAULT_PLOT.statistic,
    runValue: isOne(['last', 'min', 'max'] as const, settings['runValue']) ? settings['runValue'] : DEFAULT_PLOT.runValue,
    goal: settings['goal'] === 'max' ? 'max' : 'min',
    chart,
    ...(text(parameter?.section) && text(parameter?.name) ? {parameter: {section: parameter.section as string, name: parameter.name as string}} : {}),
  };
}
