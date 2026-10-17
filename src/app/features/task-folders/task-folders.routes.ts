import {Routes} from '@angular/router';
import {resetContextMenuGuard} from '@common/shared/guards/resetContextMenuGuard.guard';
import {experimentsProviders} from '~/features/experiments/shared/experiments.providers';
import {folderScopeGuard, folderScopeResetGuard} from './task-folder-scope.guards';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('~/features/task-folders/task-folders.component').then(c => c.TaskFoldersComponent),
    canDeactivate: [resetContextMenuGuard],
  },
  {
    // A task folder is the Experiments page, limited to the folder's experiments.
    path: ':folder',
    canActivate: [folderScopeGuard],
    canDeactivate: [folderScopeResetGuard, resetContextMenuGuard],
    providers: [experimentsProviders],
    loadChildren: () => import('@common/experiments/experiment-routes').then(r => r.routes),
  },
];
