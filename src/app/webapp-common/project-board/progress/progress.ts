export interface ProgressRun {
  created: string;
  status: string;
  /** The run's value of the metric being followed; null when it has none. */
  value: number | null;
}

export interface Progress {
  /** The best value of any run, by the goal; null when no run has a value. */
  best: number | null;
  runs: number;
  failed: number;
  /** failed / runs, 0 for no runs. */
  failureRate: number;
  /** How many runs with a value came after the run that set the best value; a run that only ties it does not count as an improvement. */
  runsSinceImprovement: number;
}

/** How a project is doing on a metric: the best value, the failure rate and how long it has been since the best value improved. */
export function computeProgress(runs: ProgressRun[], goal: 'min' | 'max'): Progress {
  const ordered = [...runs].sort((a, b) => a.created.localeCompare(b.created));
  let best: number | null = null;
  let improvedAt = -1;
  ordered.forEach((run, index) => {
    if (run.value !== null && (best === null || (goal === 'min' ? run.value < best : run.value > best))) {
      best = run.value;
      improvedAt = index;
    }
  });
  const failed = runs.filter(run => run.status === 'failed').length;
  return {
    best, runs: runs.length, failed, failureRate: runs.length ? failed / runs.length : 0,
    runsSinceImprovement: improvedAt < 0 ? 0 : ordered.slice(improvedAt + 1).filter(run => run.value !== null).length,
  };
}

/** What a progress card follows: the runs of one task (null for every run of the project), a metric (null until one is chosen) and
 *  which direction is better. */
export interface ProgressSettings {
  task: string | null;
  metric: {metric: string; variant: string} | null;
  goal: 'min' | 'max';
}

/** The settings of a progress card from whatever was stored: what is valid is kept, the rest is the default. */
export function progressSettings(raw: Record<string, unknown> | null | undefined): ProgressSettings {
  const metric = raw?.['metric'] as {metric?: unknown; variant?: unknown} | null | undefined;
  const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
  return {
    task: text(raw?.['task']) ? raw!['task'] as string : null,
    metric: text(metric?.metric) && text(metric?.variant) ? {metric: metric.metric, variant: metric.variant} : null,
    goal: raw?.['goal'] === 'max' ? 'max' : 'min',
  };
}
