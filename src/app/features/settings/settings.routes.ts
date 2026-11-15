import {Routes} from '@angular/router';
import {CrumbTypeEnum} from '@common/layout/breadcrumbs/breadcrumbs.types';

const settingsBreadcrumb = {
  name: 'Settings',
  url: 'settings',
  type: CrumbTypeEnum.Feature
};

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./settings.component').then(m => m.SettingsComponent),
    children: [
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {path: 'profile',
        loadComponent: () => import('./containers/admin/profile-name/profile-name.component').then(m => m.ProfileNameComponent),
        data: {
        staticBreadcrumb: [[settingsBreadcrumb]]},
      },
      {
        path: 'webapp-configuration',
        loadComponent: () => import('~/features/settings/containers/webapp-configuration/webapp-configuration.component').then(m => m.WebappConfigurationComponent),
        data: {workspaceNeutral: true, staticBreadcrumb: [[settingsBreadcrumb]]},
      },
      {
        path: 'devices',
        loadComponent: () => import('~/features/settings/containers/devices/devices.component').then(m => m.DevicesComponent),
        data: {
          workspaceNeutral: true,
          staticBreadcrumb: [[settingsBreadcrumb]]
        }
      },
      {
        path: 'access',
        loadComponent: () => import('~/features/settings/containers/access/access.component').then(m => m.AccessComponent),
        data: {
          workspaceNeutral: true,
          staticBreadcrumb: [[settingsBreadcrumb]]
        }
      }
    ]
  }
];
