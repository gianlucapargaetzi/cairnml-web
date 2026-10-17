import {Routes} from '@angular/router';
import {resetContextMenuGuard} from '@common/shared/guards/resetContextMenuGuard.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('~/features/task-folders/task-folders.component').then(c => c.TaskFoldersComponent),
    canDeactivate: [resetContextMenuGuard],
  },
  {
    path: ':folder',
    loadComponent: () => import('~/features/task-folders/task-folder.component').then(c => c.TaskFolderComponent),
    canDeactivate: [resetContextMenuGuard],
  },
];
