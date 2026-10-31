import {HeaderNavbarTabConfig} from '@common/layout/header-navbar-tabs/header-navbar-tabs-config.types';
import {ProjectsGetUserNamesRequest} from '~/business-logic/model/projects/projectsGetUserNamesRequest';
import EntityEnum = ProjectsGetUserNamesRequest.EntityEnum;

export const PROJECTS_FEATURES = ['models',' experiments', 'overview'];

export const PROJECT_ROUTES = [
  {header: 'overview', label: 'Overview', id: 'overviewTab'},
  {header: 'workloads', label: 'Workloads', id: 'workloadTab'},
  {header: 'folders', label: 'Tasks', id: 'tasksTab'},
  {header: 'tasks', label: 'Task list', id: 'experimentsTab'},
  {header: 'models', label: 'Models', id: 'modelsTab'},
  {header: 'settings', label: 'Project settings', id: 'settingsTab'}
] as HeaderNavbarTabConfig[];

export const fetchUsersForTypes: EntityEnum[] = ['task', 'model']
