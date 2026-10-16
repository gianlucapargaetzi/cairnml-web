import {HeaderNavbarTabConfig} from '@common/layout/header-navbar-tabs/header-navbar-tabs-config.types';

export const ORCHESTRATION_ROUTES = [
  {header: 'dashboard', featureName: 'dashboard', link: 'workers-and-queues/dashboard'},
  {header: 'workers', featureName: 'workers', link: 'workers-and-queues/workers'},
  {header: 'jobs', featureName: 'jobs', link: 'workers-and-queues/jobs'},
] as HeaderNavbarTabConfig[];

export const queueFields = ['display_name', 'last_update', 'name', 'tags', 'workers', 'entries'];
