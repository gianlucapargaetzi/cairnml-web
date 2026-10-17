import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, CanDeactivateFn} from '@angular/router';
import {Store} from '@ngrx/store';
import {from} from 'rxjs';
import {map} from 'rxjs/operators';
import {setTableFilters} from '@common/experiments/actions/common-experiments-view.actions';
import {groupTaskFolders} from '@common/tasks/task-folders.utils';
import {TaskFoldersApiService} from './task-folders-api.service';
import {UNASSIGNED_FOLDER} from './task-folders.consts';

/**
 * Before a task folder opens: set a real filter on the id column, to the folder's experiment ids.
 * Every view the experiments table has (list, details, compare) builds its request from this same
 * filter state, so the scope holds regardless of which view is open or switched to.
 */
export const folderScopeGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const store = inject(Store);
  const api = inject(TaskFoldersApiService);
  const projectId = route.pathFromRoot.map(segment => segment.params['projectId']).find(Boolean);
  const folder = route.params['folder'];

  return from(api.loadExperiments(projectId)).pipe(
    map(experiments => {
      const grouped = groupTaskFolders(experiments);
      const members = folder === UNASSIGNED_FOLDER
        ? grouped.unassigned
        : grouped.folders.find(f => f.name === folder)?.experiments ?? [];
      store.dispatch(setTableFilters({
        filters: [{col: 'id', value: members.map(experiment => experiment.id)}],
        projectId,
      }));
      return true;
    }),
  );
};

/** Leaving a task folder: every filter is cleared, so the experiments table shows everything again. */
export const folderScopeResetGuard: CanDeactivateFn<unknown> = (component, route: ActivatedRouteSnapshot) => {
  const projectId = route.pathFromRoot.map(segment => segment.params['projectId']).find(Boolean);
  inject(Store).dispatch(setTableFilters({filters: [], projectId}));
  return true;
};
