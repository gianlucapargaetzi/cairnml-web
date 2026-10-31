import {Routes} from '@angular/router';
import {CrumbTypeEnum} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {settingsProviders} from '~/features/settings/settings.providers';

const settingsBreadcrumb = {
  name: 'Settings',
  url: 'settings',
  type: CrumbTypeEnum.Feature
};

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./settings.component').then(m => m.SettingsComponent),
    providers: settingsProviders,
    children: [
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {path: 'profile',
        loadComponent: () => import('./containers/admin/profile-name/profile-name.component').then(m => m.ProfileNameComponent),
        data: {
        staticBreadcrumb:[[settingsBreadcrumb, {
            name: 'Profile',
            type: CrumbTypeEnum.SubFeature
          }]]},
      },
      {
        path: 'webapp-configuration',
        loadComponent: () => import('~/features/settings/containers/webapp-configuration/webapp-configuration.component').then(m => m.WebappConfigurationComponent),
        data: {workspaceNeutral: true, staticBreadcrumb:[[settingsBreadcrumb, {
            name: 'Configuration',
            type: CrumbTypeEnum.SubFeature
          }]]},
      },
      {
        path: 'devices',
        loadComponent: () => import('~/features/settings/containers/devices/devices.component').then(m => m.DevicesComponent),
        data: {
          workspaceNeutral: true,
          staticBreadcrumb: [[settingsBreadcrumb, {
            name: 'Devices',
            type: CrumbTypeEnum.SubFeature
          }]]
        }
      },
      {
        path: 'git-credentials',
        loadComponent: () => import('~/features/settings/containers/git-credentials/git-credentials.component').then(m => m.GitCredentialsComponent),
        data: {
          workspaceNeutral: true,
          staticBreadcrumb: [[settingsBreadcrumb, {
            name: 'Git Credentials',
            type: CrumbTypeEnum.SubFeature
          }]]
        }
      },
      {
        path: 'storage-credentials',
        loadComponent: () => import('@common/settings/storage-credentials/storage-credentials.component').then(m => m.StorageCredentialsComponent),
        data: {
          workspaceNeutral: true,
          route: '/settings/storage-credentials',
          staticBreadcrumb: [[settingsBreadcrumb, {
            name: 'Storage Cleanup',
            type: CrumbTypeEnum.SubFeature
          }]]
        }
      }
    ]
  }
];
