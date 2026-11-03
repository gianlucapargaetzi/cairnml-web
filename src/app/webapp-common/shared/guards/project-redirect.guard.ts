import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {selectSelectedMetricVariantForCurrProject, selectSelectedProject} from '../../core/reducers/projects.reducer';
import {filter, map, tap, withLatestFrom} from 'rxjs/operators';
import {setSelectedProjectId} from '@common/core/actions/projects.actions';
import {addMessage} from '@common/core/actions/layout.actions';
import {MESSAGES_SEVERITY} from '~/app.constants';
import {of} from 'rxjs';
import {timeout} from 'rxjs/operators';

// How long to wait for the requested project before treating it as not found.
const PROJECT_LOAD_TIMEOUT_MS = 10000;

export const projectRedirectGuardGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const store = inject(Store);
  const router = inject(Router);
  return store.select(selectSelectedProject).pipe(
    tap(project => project === null && store.dispatch(setSelectedProjectId({projectId: route.params.projectId}))),
    filter(project => project?.id === route.params.projectId),
    timeout({first: PROJECT_LOAD_TIMEOUT_MS, with: () => of(null)}),
    withLatestFrom(store.select(selectSelectedMetricVariantForCurrProject)),
    map(([project, metVar]) => {
      if (!project) {
        store.dispatch(addMessage(MESSAGES_SEVERITY.ERROR, 'The project was not found.'));
        return router.parseUrl('/dashboard');
      }
      return router.parseUrl(`projects/${project.id}/${(project.description || metVar) ? 'overview' : 'folders'}`);
    }));
};
