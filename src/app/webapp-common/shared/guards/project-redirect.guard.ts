import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {of} from 'rxjs';
import {catchError, filter, map, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {selectSelectedMetricVariantForCurrProject, selectSelectedProject} from '../../core/reducers/projects.reducer';
import {setSelectedProjectId} from '@common/core/actions/projects.actions';
import {addMessage} from '@common/core/actions/layout.actions';
import {MESSAGES_SEVERITY} from '~/app.constants';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';

// The server answers 400 with subcode 401 ('Invalid project id') for a project that does not exist or that the user cannot see.
const INVALID_PROJECT_SUBCODE = 401;

export const projectRedirectGuardGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const store = inject(Store);
  const router = inject(Router);
  const projectsApi = inject(ApiProjectsService);
  const projectId: string = route.params.projectId;

  const toDashboard = (message: string) => {
    store.dispatch(addMessage(MESSAGES_SEVERITY.ERROR, message));
    return router.parseUrl('/dashboard');
  };

  return projectsApi.projectsGetById({project: projectId}).pipe(
    switchMap(() => store.select(selectSelectedProject).pipe(
      tap(project => project === null && store.dispatch(setSelectedProjectId({projectId}))),
      filter(project => project?.id === projectId),
      withLatestFrom(store.select(selectSelectedMetricVariantForCurrProject)),
      map(([project, metVar]) => router.parseUrl(`projects/${project.id}/${(project.description || metVar) ? 'overview' : 'folders'}`))
    )),
    catchError(error => {
      const subcode = error?.error?.meta?.result_subcode ?? error?.meta?.result_subcode;
      return of(subcode === INVALID_PROJECT_SUBCODE
        ? toDashboard('The project was not found.')
        : toDashboard('The project could not be opened.'));
    })
  );
};
