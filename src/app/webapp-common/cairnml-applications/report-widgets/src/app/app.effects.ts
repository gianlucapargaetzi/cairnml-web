import {inject, Injectable} from '@angular/core';
import {selectSignedUrl} from '@common/core/reducers/common-auth-reducer';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';
import {getParcoords, getPlot, getSample, getScalar, getSingleValues, setNoPermissions, setParallelCoordinateExperiments, setPlotData, setSampleData, setSignIsNeeded, setSingleValues, setTaskData} from './app.actions';
import {EMPTY, mergeMap, of, switchMap} from 'rxjs';
import {Store} from '@ngrx/store';
import {catchError, filter} from 'rxjs/operators';
import {ReportsGetTaskDataResponse} from '~/business-logic/model/reports/reportsGetTaskDataResponse';
import {ApiReportsService} from '~/business-logic/api-services/reports.service';
import {ApiOptions} from '~/business-logic/api-services/api';
import {getSignedUrl, setSignedUrl} from '@common/core/actions/common-auth.actions';
import {SignResponse} from '@common/settings/admin/base-admin-utils';
import {DebugSample} from '@common/shared/debug-sample/debug-sample.reducer';
import {requestFailed} from '@common/core/actions/http.actions';
import {Task} from '~/business-logic/model/tasks/task';
import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';
import {ReportsApiMultiplotsResponse} from '@common/constants';
import {AdminService} from '~/shared/services/admin.service';


@Injectable()
export class AppEffects {
  private reportsApi = inject(ApiReportsService);
  private store = inject(Store);
  private actions$ = inject(Actions);
  private adminService = inject(AdminService);

  /** The tenant header of the company, and the query of the page's URL (the parameters the widget was opened with). */
  getOptions(company: string, otherSearchParams?: URLSearchParams): ApiOptions {
    const params: Record<string, string[]> = {};
    otherSearchParams?.forEach((value, key) => params[key] = [...(params[key] ?? []), value]);
    return {headers: {'X-Cairnml-Tenant': company}, params};
  }

  getPlot = createEffect(() => this.actions$.pipe(
    ofType(getPlot),
    switchMap(action => this.reportsApi.reportsGetTaskData({
        id: action.tasks,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        model_events: action.models,
        plots: {
          iters: 1,
          metrics: action.metrics.map(metric => ({metric, variants: action.variants}))
        }
      }, this.getOptions(action.company, action.otherSearchParams))
    ),
    mergeMap((res) => [
      setTaskData({
        sourceProject: this.getProject(res.tasks),
        sourceTasks: res.tasks.map(t => t.id),
        appId: (res.tasks[0] as any)?.application?.app_id?.id
      }),
      setPlotData({data: res.plots as unknown as ReportsApiMultiplotsResponse})
    ]),
    catchError(error => [requestFailed(error), ...(error.status === 403 ? [setNoPermissions()] : [])])
  ));

  getScalar = createEffect(() => this.actions$.pipe(
    ofType(getScalar),
    mergeMap(action => this.reportsApi.reportsGetTaskData({
          id: action.tasks,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          model_events: action.models,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          scalar_metrics_iter_histogram: {
            metrics: action.metrics.map(metric => ({metric, variants: action.variants})),
            key: action.xaxis || ScalarKeyEnum.Iter
          }
        }, this.getOptions(action.company, action.otherSearchParams)).pipe(
        mergeMap(res => [
          setPlotData({data: res.scalar_metrics_iter_histogram as ReportsApiMultiplotsResponse}),
          setTaskData({
            sourceProject: this.getProject(res.tasks),
            sourceTasks: res.tasks.map(t => t.id),
            appId: (res.tasks[0] as any)?.application?.app_id?.id
          })]
        ), catchError(error => [requestFailed(error), ...(error.status === 403 ? [setNoPermissions()] : [])])
      )
    )
  ));

  getSample = createEffect(() => this.actions$.pipe(
    ofType(getSample),
    switchMap(action => this.reportsApi.reportsGetTaskData({
          id: action.tasks,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          debug_images: {
            iters: 1,
            metrics: action.metrics.map(metric => ({metric, variants: action.variants}))
          }
        }, this.getOptions(action.company, action.otherSearchParams)).pipe(
        mergeMap(res => [
          setSampleData({data: res.debug_images?.[0]?.iterations?.[0]?.events[0] as DebugSample}),
          setTaskData({sourceProject: this.getProject(res.tasks), sourceTasks: res.tasks.map(t => t.id)})]),
        catchError(error => [requestFailed(error), ...(error.status === 403 ? [setNoPermissions()] : [])])
      )
    ))
  );

  getParcoords$ = createEffect(() => this.actions$.pipe(
    ofType(getParcoords),
    mergeMap((action) => this.reportsApi.reportsGetTaskData({
        id: action.tasks,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        only_fields: ['last_metrics', 'name', 'last_iteration', 'project', ...action.variants.map(variant => `hyperparams.${variant}`)]
      }, this.getOptions(action.company, action.otherSearchParams))
        .pipe(
          mergeMap(res => [
            setParallelCoordinateExperiments({data: res.tasks as unknown as Task[]}),
            setTaskData({sourceProject: this.getProject(res.tasks), sourceTasks: res.tasks.map(t => t.id)})
          ])
        )
    ))
  );

  getScalarSingleValue$ = createEffect(() => this.actions$.pipe(
    ofType(getSingleValues),
    switchMap((action) => this.reportsApi.reportsGetTaskData({
        id: action.tasks,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        model_events: action.models,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        single_value_metrics: {}
      }, this.getOptions(action.company, action.otherSearchParams))
    ),
    mergeMap((res: ReportsGetTaskDataResponse) => [
        setSingleValues({data: res.single_value_metrics}),
        setTaskData({sourceProject: this.getProject(res.tasks), sourceTasks: res.tasks.map(t => t.id)})
      ]
    )
  ));

  signUrl = createEffect(() => this.actions$.pipe(
    ofType(getSignedUrl),
    filter(action => !!action.url),
    mergeMap(action =>
      of(action).pipe(
        concatLatestFrom(() => this.store.select(selectSignedUrl(action.url))),
        switchMap(([, prevSigned]) => this.adminService.signUrlIfNeeded(action.url, action.config, prevSigned)),
        filter(res => !!res),
        switchMap((res: SignResponse) => {
            switch (res.type) {
              case 'popup':
                return [setSignIsNeeded()];
              case 'sign':
                return [setSignedUrl({url: action.url, signed: res.signed, expires: res.expires})];
              default:
                return EMPTY;
            }
          }
        )
      )
    )
  ));

  getProject(tasks: any[]): string {
    return tasks?.find(task => task.project)?.project.id ?? '*';
  }
}
