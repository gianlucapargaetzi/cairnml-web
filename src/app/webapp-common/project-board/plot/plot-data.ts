import {PlotSpec} from './plot-spec';
import {MAX_RUNS, numericValue, PlotRun} from './plot-transforms';

/** The part of a task (`tasks.get_all_ex`) that a plot reads. */
export interface PlotTask {
  id: string;
  name?: string;
  status?: string;
  created?: string;
  active_duration?: number;
  last_metrics?: Record<string, Record<string, {metric?: string; variant?: string; value?: number; min_value?: number; max_value?: number}>>;
  hyperparams?: Record<string, Record<string, {value?: unknown}>>;
}

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The fields a plot needs of a task: the same for every plot, and the one parameter a plot against a parameter or about a parameter reads. */
function onlyFields(spec: PlotSpec): string[] {
  const fields = ['id', 'name', 'status', 'created', 'started', 'active_duration', 'last_metrics'];
  if (spec.source.kind === 'metadata') {
    fields.push(`hyperparams.${spec.source.section}.${spec.source.name}`);
  }
  if (spec.view === 'vs-parameter' && spec.parameter) {
    fields.push(`hyperparams.${spec.parameter.section}.${spec.parameter.name}`);
  }
  return fields;
}

/** The request for the runs of a plot: the newest runs (at most `MAX_RUNS`) of the project, without archived ones. */
export function taskQuery(projectId: string, spec: PlotSpec) {
  return {
    project: [projectId],
    only_fields: onlyFields(spec),
    order_by: ['-created'],
    page: 0,
    page_size: MAX_RUNS,
    system_tags: ['-archived'],
    ...(spec.runs.scope === 'task' ? {name: `^${escapeRegex(spec.runs.task)}$`} : {}),
    ...(spec.runs.scope === 'set' ? {id: spec.runs.ids} : {}),
  };
}

function scalarValue(task: PlotTask, spec: PlotSpec & {source: {kind: 'scalar'}}): number | null {
  for (const variants of Object.values(task.last_metrics ?? {})) {
    for (const entry of Object.values(variants)) {
      if (entry.metric === spec.source.metric && entry.variant === spec.source.variant) {
        return numericValue(spec.runValue === 'min' ? entry.min_value : spec.runValue === 'max' ? entry.max_value : entry.value);
      }
    }
  }
  return null;
}

/** A plot's run from a task: the value of the chosen scalar, parameter or fact, and the parameter of a plot against a parameter. */
export function taskToPlotRun(task: PlotTask, spec: PlotSpec): PlotRun {
  const source = spec.source;
  let value: number | null = null;
  if (source.kind === 'scalar') {
    value = scalarValue(task, spec as PlotSpec & {source: {kind: 'scalar'}});
  } else if (source.kind === 'metadata') {
    value = numericValue(task.hyperparams?.[source.section]?.[source.name]?.value);
  } else if (source.kind === 'fact' && source.fact === 'duration') {
    value = numericValue(task.active_duration);
  }
  const params: Record<string, number | string> = {};
  if (spec.parameter) {
    const raw = task.hyperparams?.[spec.parameter.section]?.[spec.parameter.name]?.value;
    if (typeof raw === 'number' || typeof raw === 'string') {
      params[`${spec.parameter.section}/${spec.parameter.name}`] = raw;
    }
  }
  return {id: task.id, name: task.name ?? '', status: task.status ?? '', created: task.created ?? '', value, params};
}
