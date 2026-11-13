import {inject, Injectable} from '@angular/core';
import {map, Observable, of, switchMap} from 'rxjs';
import {HTTP} from '~/app.constants';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {buildPlotModel, PlotCurve, PlotModel} from './plot-model';
import {PlotSpec} from './plot-spec';
import {PlotTask, taskQuery, taskToPlotRun} from './plot-data';
import {curveRunIds, MAX_RUNS, numericValue, PlotRun} from './plot-transforms';

/** Where the plot cards get their data: the runs of the project, the curves of some runs, and the metrics and parameters to choose from. */
@Injectable({providedIn: 'root'})
export class PlotDataService {
  private readonly api = inject(SmApiRequestsService);

  private post<T>(call: string, body: object): Observable<T> {
    return this.api.post<T>(`${HTTP.API_BASE_URL}/${call}`, body, {});
  }

  /** The runs a plot is about. `capped` is true when the project has more runs than a plot reads (the newest `MAX_RUNS` are returned). */
  runs(projectId: string, spec: PlotSpec): Observable<{runs: PlotRun[]; capped: boolean}> {
    return this.post<{tasks?: PlotTask[]}>('tasks.get_all_ex', taskQuery(projectId, spec)).pipe(
      map(response => {
        const tasks = response?.tasks ?? [];
        return {runs: tasks.map(task => taskToPlotRun(task, spec)), capped: tasks.length >= MAX_RUNS};
      }));
  }

  /** A plot ready to draw: the runs it is about, and for a curve view the curves of the runs it needs. `capped`: more runs exist than were read. */
  load(projectId: string, spec: PlotSpec): Observable<{model: PlotModel; capped: boolean}> {
    return this.runs(projectId, spec).pipe(switchMap(({runs, capped}) => {
      const ids = spec.source.kind === 'scalar' ? curveRunIds(spec.view, runs, spec.goal) : [];
      const curves$ = spec.source.kind === 'scalar' ? this.curves(ids, spec.source.metric, spec.source.variant) : of([]);
      return curves$.pipe(map(curves => ({model: buildPlotModel(spec, runs, curves), capped})));
    }));
  }

  /** The curves of a scalar for some runs, from the first reported iteration to the last. */
  curves(taskIds: string[], metric: string, variant: string): Observable<PlotCurve[]> {
    if (!taskIds.length) {
      return of([]);
    }
    return this.post<{metrics?: Record<string, Record<string, Record<string, {name?: string; x?: number[]; y?: number[]}>>>}>(
      'events.multi_task_scalar_metrics_iter_histogram', {tasks: taskIds, samples: 100, key: 'iter'}).pipe(
      map(response => {
        const byTask = response?.metrics?.[metric]?.[variant] ?? {};
        return Object.entries(byTask).map(([id, series]) => ({
          id, name: series.name ?? id, points: (series.x ?? []).map((x, i) => ({x, y: (series.y ?? [])[i]})),
        }));
      }));
  }

  /** The numeric parameters of the newest runs of a project, to choose from (`section` and `name`), without the dataset records. */
  parameters(projectId: string): Observable<{section: string; name: string}[]> {
    return this.post<{tasks?: PlotTask[]}>('tasks.get_all_ex', {
      project: [projectId], only_fields: ['hyperparams'], order_by: ['-created'], page: 0, page_size: 100, system_tags: ['-archived'],
    }).pipe(map(response => {
      const found = new Map<string, {section: string; name: string}>();
      for (const task of response?.tasks ?? []) {
        for (const [section, entries] of Object.entries(task.hyperparams ?? {})) {
          for (const [name, entry] of Object.entries(entries)) {
            if (section !== 'Datasets' && numericValue(entry.value) !== null) {
              found.set(`${section}/${name}`, {section, name});
            }
          }
        }
      }
      return [...found.values()].sort((a, b) => `${a.section}/${a.name}`.localeCompare(`${b.section}/${b.name}`));
    }));
  }

  /** The metric and variant names the runs of a project reported. */
  metrics(projectId: string): Observable<{metric: string; variant: string}[]> {
    return this.post<{metrics?: {metric: string; variant: string}[]}>('projects.get_unique_metric_variants', {project: projectId}).pipe(
      map(response => (response?.metrics ?? []).filter(item => !item.metric.startsWith(':')).map(({metric, variant}) => ({metric, variant}))));
  }
}
