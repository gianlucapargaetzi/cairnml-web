import {HeaderNavbarTabConfig} from '@common/layout/header-navbar-tabs/header-navbar-tabs-config.types';

export const ORCHESTRATION_ROUTES = [
  {header: 'agents', label: 'Agents', featureName: 'workers', link: 'workers-and-queues/workers'},
  {header: 'queues', label: 'Queues', featureName: 'queues', link: 'workers-and-queues/queues'},
] as HeaderNavbarTabConfig[];

export const queueFields = ['display_name', 'last_update', 'name', 'tags', 'workers', 'entries'];
