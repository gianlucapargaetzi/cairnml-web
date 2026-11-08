import {Routes} from '@angular/router';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {CrumbTypeEnum} from '@common/layout/breadcrumbs/breadcrumbs.types';
import {commonProjectsProviders} from '@common/projects/common-projects.providers';
import {resetContextMenuGuard} from '@common/shared/guards/resetContextMenuGuard.guard';

const datasetsBreadcrumb = [[{
  name: 'Datasets & Repositories',
  type: CrumbTypeEnum.Feature
}]];

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('~/features/datasets/datasets-and-repositories.component').then(c => c.DatasetsAndRepositoriesComponent),
    canDeactivate: [resetContextMenuGuard],
    children: [
      {path: '', redirectTo: 'datasets', pathMatch: 'full'},
      {
        path: 'datasets',
        loadComponent: () => import('@common/datasets/open-datasets/open-datasets.component').then(c => c.OpenDatasetsComponent),
        data: {search: true, staticBreadcrumb: datasetsBreadcrumb},
        providers: [
          ...commonProjectsProviders
        ]
      },
      {
        path: 'repositories',
        loadComponent: () => import('@common/datasets/repositories-page/repositories-page.component').then(c => c.RepositoriesPageComponent),
        data: {search: false, staticBreadcrumb: datasetsBreadcrumb},
      },
    ]
  },
  {
    path: 'simple/:projectId',
    data: {search: true},
    providers: [
      ...commonProjectsProviders
    ],
    children: [
      {
        path: 'datasets',
        loadComponent: () => import('@common/datasets/open-datasets/open-datasets.component').then(c => c.OpenDatasetsComponent),
        data: {search: true}
      },
      {
        path: 'projects',
        loadComponent: () => import('@common/datasets/nested-open-datasets-page/nested-open-datasets-page.component').then(c => c.NestedOpenDatasetsPageComponent),
        data: {search: true}
      },
      {path: 'experiments', redirectTo: 'tasks'},
      {
        path: 'tasks',
        loadChildren: () => import('@common/dataset-version/dataset-version.routes')
          .then(r => r.routes)
      },
      {
        path: 'compare-tasks',
        data: {entityType: EntityTypeEnum.dataset},
        loadChildren: () => import('@common/experiments-compare/experiments-compare.routes').then(r => r.routes)
      },
    ]
  },
];
