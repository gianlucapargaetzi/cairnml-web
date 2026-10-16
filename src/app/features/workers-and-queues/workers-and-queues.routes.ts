import {Routes} from '@angular/router';
import {WorkersAndQueuesResolver} from '~/shared/resolvers/workers-and-queues.resolver';
import {CrumbTypeEnum} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {resetContextMenuGuard} from '@common/shared/guards/resetContextMenuGuard.guard';
import {workersAndQueuesProviders} from '@common/workers-and-queues/workers-and-queues.providers';

const wQBreadcrumb = [[{
  name: 'WORKERS AND QUEUES',
  type: CrumbTypeEnum.Feature
}]];

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('~/features/workers-and-queues/orchestration.component').then(c => c.OrchestrationComponent),
    canDeactivate: [resetContextMenuGuard],
    providers: [workersAndQueuesProviders],
    resolve: {
      queuesManager: WorkersAndQueuesResolver
    },
    children: [
      {path: '', redirectTo: 'dashboard', pathMatch: 'full'},
      {
        path: 'dashboard',
        loadComponent: () => import('~/features/workers-and-queues/dashboard/resources-dashboard.component').then(c => c.ResourcesDashboardComponent),
        data: {staticBreadcrumb: wQBreadcrumb}
      },
      {
        path: 'workers',
        loadComponent: () => import('~/features/workers-and-queues/scheduler/workers-tree.component').then(c => c.WorkersTreeComponent),
        data: {staticBreadcrumb: wQBreadcrumb}
      },
      {
        path: 'jobs',
        loadComponent: () => import('~/features/workers-and-queues/scheduler/jobs-list.component').then(c => c.JobsListComponent),
        data: {staticBreadcrumb: wQBreadcrumb}
      },
      {path: 'queues', redirectTo: 'jobs', pathMatch: 'full'},
    ]
  }
];
