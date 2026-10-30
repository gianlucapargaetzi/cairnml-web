import {HeaderNavbarTabConfig} from '@common/layout/header-navbar-tabs/header-navbar-tabs-config.types';
import {ProjectsGetUserNamesRequest} from '~/business-logic/model/projects/projectsGetUserNamesRequest';
import EntityEnum = ProjectsGetUserNamesRequest.EntityEnum;

export const PROJECTS_FEATURES = ['models',' experiments', 'overview'];

export const PROJECT_ROUTES = [
  {header: 'overview', id: 'overviewTab'},
  {header: 'workloads', id: 'workloadTab'},
  {header: 'folders', label: 'tasks', id: 'tasksTab'},
  {header: 'tasks', label: 'experiments', id: 'experimentsTab'},
  {header: 'models', id: 'modelsTab'},
  {header: 'settings', label: 'project settings', id: 'settingsTab'}
] as HeaderNavbarTabConfig[];

export const fetchUsersForTypes: EntityEnum[] = ['task', 'model']
