/** One run, with the value the plot is about. The functions here are pure: the data service builds the runs, the cards draw the results. */
export interface PlotRun {
  id: string;
  name: string;
  status: string;
  /** ISO time the run was created. */
  created: string;
  /** The run's value of the plotted scalar, parameter or fact; null when it has none. */
  value: number | null;
  /** The parameters the plot may need, by `section/name`. */
  params: Record<string, number | string>;
}

/** The most runs a plot reads. A plot of a bigger project shows the newest ones and says so. */
export const MAX_RUNS = 500;

/** A number from a number or a numeric string; null for anything else (an empty string, text, a missing value). */
export function numericValue(raw: unknown): number | null {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : null;
  }
  if (typeof raw === 'string' && raw.trim() !== '') {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

const oldestFirst = (runs: PlotRun[]) => [...runs].sort((a, b) => a.created.localeCompare(b.created));
const withValue = (runs: PlotRun[]) => runs.filter(run => run.value !== null);

/** One point per run (oldest first, runs without a value left out): what the chosen statistic of the values of the runs so far is. */
export function evolution(runs: PlotRun[], statistic: 'avg' | 'min' | 'max' | 'best-so-far' | 'last', goal: 'min' | 'max'): {x: string; y: number}[] {
  const points: {x: string; y: number}[] = [];
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  for (const run of withValue(oldestFirst(runs))) {
    const value = run.value as number;
    min = Math.min(min, value);
    max = Math.max(max, value);
    sum += value;
    const y = statistic === 'last' ? value : statistic === 'min' ? min : statistic === 'max' ? max : statistic === 'avg' ? sum / (points.length + 1)
      : goal === 'min' ? min : max;
    points.push({x: run.created, y});
  }
  return points;
}

/** The run with the best value, by the goal; null when no run has a value. */
export function bestRun(runs: PlotRun[], goal: 'min' | 'max'): PlotRun | null {
  return withValue(runs).reduce<PlotRun | null>((best, run) =>
    best === null || (goal === 'min' ? run.value! < best.value! : run.value! > best.value!) ? run : best, null);
}

/** The newest run that has a value; null when none has. */
export function lastRun(runs: PlotRun[]): PlotRun | null {
  const ordered = withValue(oldestFirst(runs));
  return ordered.length ? ordered[ordered.length - 1] : null;
}

/** The values in equal bins from the smallest to the largest value; every value is in exactly one bin. Values that are all equal are one bin. */
export function distribution(runs: PlotRun[], bins: number): {from: number; to: number; count: number}[] {
  const values = withValue(runs).map(run => run.value as number);
  if (!values.length) {
    return [];
  }
  const low = Math.min(...values);
  const high = Math.max(...values);
  if (low === high) {
    return [{from: low, to: high, count: values.length}];
  }
  const width = (high - low) / bins;
  const result = Array.from({length: bins}, (_, i) => ({from: low + i * width, to: i === bins - 1 ? high : low + (i + 1) * width, count: 0}));
  for (const value of values) {
    result[Math.min(bins - 1, Math.floor((value - low) / width))].count++;
  }
  return result;
}

/** Points of the parameter (x) against the value (y), for the runs that have both as numbers. */
export function versusParameter(runs: PlotRun[], parameterKey: string): {x: number; y: number}[] {
  const points: {x: number; y: number}[] = [];
  for (const run of runs) {
    const x = numericValue(run.params[parameterKey]);
    if (x !== null && run.value !== null) {
      points.push({x, y: run.value});
    }
  }
  return points;
}

/** The number of runs created on every day (the day of the ISO time), oldest day first. */
export function runsPerDay(runs: PlotRun[]): {x: string; y: number}[] {
  const days = new Map<string, number>();
  for (const run of oldestFirst(runs)) {
    const day = run.created.slice(0, 10);
    days.set(day, (days.get(day) ?? 0) + 1);
  }
  return [...days].map(([x, y]) => ({x, y}));
}

/** The number of runs in every status, in the order the statuses first appear. */
export function statusCounts(runs: PlotRun[]): {label: string; count: number}[] {
  const counts = new Map<string, number>();
  for (const run of runs) {
    counts.set(run.status, (counts.get(run.status) ?? 0) + 1);
  }
  return [...counts].map(([label, count]) => ({label, count}));
}
