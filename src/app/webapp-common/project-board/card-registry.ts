import {Type, WritableSignal} from '@angular/core';
import {BoardCardType} from './board.model';
import {DEFAULT_PLOT} from './plot/plot-spec';

/**
 * What every card body gets: the project and the settings of its card. A body component declares both as inputs
 * (`projectId = input.required<string>()`, `settings = input<Record<string, unknown>>({})`), because the board mounts it with exactly these.
 */
export interface CardBodyInputs {
  projectId: string;
  settings: Record<string, unknown>;
}

/** What a card's settings component gets: a signal it reads and writes; Apply in the dialog saves its value. */
export interface CardSettingsInputs {
  draft: WritableSignal<Record<string, unknown>>;
}

export interface CardTypeDef {
  label: string;
  /** The `al-ico-*` icon of the type. */
  icon: string;
  /** One line for the add-card dialog. */
  description: string;
  /** Size of a new card: columns and rows (a tile is `SUB_ROWS` rows). */
  defaultSize: {w: number; h: number};
  defaultSettings: () => Record<string, unknown>;
  /** The panels of the old overview bring their own surface; every other card gets the board's card surface. */
  bare?: boolean;
  /** The component that shows the card. A type without one shows as unavailable. */
  body?: () => Promise<Type<unknown>>;
  /** The component of the card's settings dialog. A type without one has no pen. */
  settings?: () => Promise<Type<unknown>>;
}

const none = () => ({});

/** Every card type of the board, in the order the add-card dialog lists them. Tasks that build a card register its body here. */
export const CARD_TYPES: Record<BoardCardType, CardTypeDef> = {
  'plot': {
    label: 'Plot', icon: 'al-ico-scatter-view', description: 'A metric, a parameter or a fact about the runs, as a chart',
    defaultSize: {w: 3, h: 12}, defaultSettings: () => ({...DEFAULT_PLOT}) as unknown as Record<string, unknown>,
    body: () => import('./plot/plot-card.component').then(m => m.PlotCardComponent),
    settings: () => import('./plot/plot-settings.component').then(m => m.PlotSettingsComponent),
  },
  'progress': {
    label: 'Progress', icon: 'al-ico-training', description: 'The best value so far, the failure rate and the runs since the last improvement',
    defaultSize: {w: 2, h: 8}, defaultSettings: () => ({task: null, metric: null, goal: 'min'}),
    body: () => import('./progress/progress-card.component').then(m => m.ProgressCardComponent),
    settings: () => import('./progress/progress-settings.component').then(m => m.ProgressSettingsComponent),
  },
  'project-state': {
    label: 'Project state', icon: 'al-ico-experiment-view', description: 'How many tasks, pipelines and models, by state',
    defaultSize: {w: 3, h: 16}, defaultSettings: none, bare: true,
    body: () => import('./cards/project-state-card.component').then(m => m.ProjectStateCardComponent),
  },
  'recent-tasks': {
    label: 'Recent tasks', icon: 'al-ico-table-view', description: 'The latest tasks of the project',
    defaultSize: {w: 6, h: 16}, defaultSettings: none, bare: true,
    body: () => import('./cards/recent-tasks-card.component').then(m => m.RecentTasksCardComponent),
  },
  'metric-snapshot': {
    label: 'Metric snapshot', icon: 'al-ico-charts-view', description: 'The latest value of a metric for the best tasks',
    defaultSize: {w: 6, h: 12}, defaultSettings: none, bare: true,
    body: () => import('./cards/metric-snapshot-card.component').then(m => m.MetricSnapshotCardComponent),
  },
  'contributions': {
    label: 'Contributions', icon: 'al-ico-users', description: 'Who ran how many tasks, day by day',
    defaultSize: {w: 3, h: 16}, defaultSettings: () => ({topContributors: 5}), bare: true,
    body: () => import('./cards/contributions-card.component').then(m => m.ContributionsCardComponent),
    settings: () => import('./cards/contribution-settings.component').then(m => m.ContributionSettingsComponent),
  },
  'description': {
    label: 'Project overview', icon: 'al-ico-description', description: 'The project description (markdown)',
    defaultSize: {w: 6, h: 16}, defaultSettings: none, bare: true,
    body: () => import('./cards/description-card.component').then(m => m.DescriptionCardComponent),
  },
  'dataset-content': {
    label: 'Dataset content', icon: 'al-ico-datasets', description: 'How the number of samples of a dataset changed from version to version',
    defaultSize: {w: 3, h: 12}, defaultSettings: none,
  },
  'agents': {
    label: 'Agents', icon: 'al-ico-queues', description: 'The agents of the project and what they are doing',
    defaultSize: {w: 3, h: 12}, defaultSettings: none,
  },
  'repositories': {
    label: 'Repositories and datasets', icon: 'al-ico-project-path', description: 'The repositories and datasets the project uses',
    defaultSize: {w: 3, h: 12}, defaultSettings: none,
  },
  'divider': {
    label: 'Divider', icon: 'al-ico-line-expand', description: 'A titled line that separates parts of the board',
    defaultSize: {w: 6, h: 1}, defaultSettings: () => ({title: ''}),
    settings: () => import('./cards/divider-settings.component').then(m => m.DividerSettingsComponent),
  },
};

export const CARD_TYPE_LIST: {type: BoardCardType; def: CardTypeDef}[] =
  (Object.keys(CARD_TYPES) as BoardCardType[]).map(type => ({type, def: CARD_TYPES[type]}));
