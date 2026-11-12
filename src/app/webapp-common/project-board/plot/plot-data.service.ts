import {inject, Injectable} from '@angular/core';
import {map, Observable, of} from 'rxjs';
import {HTTP} from '~/app.constants';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {PlotSpec} from './plot-spec';
import {PlotTask, taskQuery, taskToPlotRun} from './plot-data';
import {MAX_RUNS, PlotRun} from './plot-transforms';

export interface PlotCurve {
  id: string;
  name: string;
  points: {x: number; y: number}[];
}

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

  /** The metric and variant names the runs of a project reported. */
  metrics(projectId: string): Observable<{metric: string; variant: string}[]> {
    return this.post<{metrics?: {metric: string; variant: string}[]}>('projects.get_unique_metric_variants', {project: projectId}).pipe(
      map(response => (response?.metrics ?? []).filter(item => !item.metric.startsWith(':')).map(({metric, variant}) => ({metric, variant}))));
  }
}
