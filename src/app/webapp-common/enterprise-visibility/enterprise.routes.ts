import {Routes} from '@angular/router';
import {CrumbTypeEnum, IBreadcrumbsLink} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {EnterpriseComponent} from '@common/enterprise-visibility/enterprise/enterprise.component';

const data = {
  staticBreadcrumb: [[{
    name: 'Enterprise Features (Overview)',
    type: CrumbTypeEnum.Feature
  } as IBreadcrumbsLink]]
};

export const routes: Routes = [{
  path: '',
  component: EnterpriseComponent,
  children: [
    {path: '', pathMatch: 'full', redirectTo: 'interactive-sessions'},
    {
      path: 'interactive-sessions', data,
      loadComponent: () => import('./interactive-sessions/interactive-sessions.component').then(c => c.InteractiveSessionsComponent)
    },
    {
      path: 'data-management', data,
      loadComponent: () => import('./data-management/data-management.component').then(c => c.DataManagementComponent)
    },
    {
      path: 'genai', data,
      loadComponent: () => import('./genai/genai.component').then(c => c.GenaiComponent)
    },
    {
      path: 'security', data,
      loadComponent: () => import('./security/security.component').then(c => c.SecurityComponent)
    },
  ]
}];
