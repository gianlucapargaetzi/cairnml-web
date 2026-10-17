import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, CanDeactivateFn} from '@angular/router';
import {Store} from '@ngrx/store';
import {from} from 'rxjs';
import {map} from 'rxjs/operators';
import {setFolderScope} from '@common/experiments/actions/common-experiments-view.actions';
import {groupTaskFolders} from '@common/tasks/task-folders.utils';
import {TaskFoldersApiService} from './task-folders-api.service';
import {UNASSIGNED_FOLDER} from './task-folders.consts';

/** Before a task folder opens: limit the experiments table to the folder's experiments. */
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
      store.dispatch(setFolderScope({ids: members.map(experiment => experiment.id)}));
      return true;
    }),
  );
};

/** Leaving a task folder: the experiments table shows every experiment again. */
export const folderScopeResetGuard: CanDeactivateFn<unknown> = () => {
  inject(Store).dispatch(setFolderScope({ids: null}));
  return true;
};
