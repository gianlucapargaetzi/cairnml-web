import {HeaderNavbarTabConfig} from '@common/layout/header-navbar-tabs/header-navbar-tabs-config.types';

// The tabs of the Datasets & Repositories page, in the header strip (as the Agents & Queues page does)
export const DATASETS_ROUTES = [
  {header: 'datasets', label: 'Datasets', featureName: 'datasets', link: 'datasets/datasets'},
  {header: 'repositories', label: 'Repositories', featureName: 'repositories', link: 'datasets/repositories'},
] as HeaderNavbarTabConfig[];
