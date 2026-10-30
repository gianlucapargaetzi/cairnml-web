import {EXPERIMENT_INFO_ONLY_FIELDS_BASE, TASK_EXPORT_ONLY_FIELDS_BASE} from '@common/experiments/experiment.consts';
import {DATASETS_STATUS_LABEL, EXPERIMENTS_STATUS_LABELS} from '~/features/experiments/shared/experiments.const';
import {TaskStatusEnum} from '~/business-logic/model/tasks/taskStatusEnum';
export {INITIAL_EXPERIMENT_TABLE_COLS} from '../../webapp-common/experiments/experiment.consts';

export const GET_ALL_QUERY_ANY_FIELDS = ['id', 'name', 'comment', 'system_tags', 'models.output.model', 'models.input.model'];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getExperimentInfoOnlyFields = (hasDataFeature: boolean) => EXPERIMENT_INFO_ONLY_FIELDS_BASE;

export const getTaskExportOnlyFields = (hasDataFeature: boolean) => TASK_EXPORT_ONLY_FIELDS_BASE;

export interface Link {
  name: string;
  url: string[];
  activeBy?: string;
}

export const infoTabLinks = [
  {name: 'Execution', url: ['execution']},
  {name: 'Configuration', url: ['hyper-params', 'hyper-param', '_empty_'], activeBy: 'hyper-params'},
  {name: 'Artifacts', url: ['artifacts']},
  {name: 'Info', url: ['general']},
  {name: 'Console', url: ['log'], output: true},
  {name: 'Scalars', url: ['scalars'], output: true},
  {name: 'Plots', url: ['plots'], output: true},
  {name: 'Debug samples', url: ['debugImages'], output: true}
];

export const FILTERED_EXPERIMENTS_STATUS_OPTIONS = (isDataset) => Object.entries(EXPERIMENTS_STATUS_LABELS)
  .filter(([key]: [TaskStatusEnum, string]) => key !== TaskStatusEnum.Closed)
  .map(([key, val]) => ({label: isDataset && DATASETS_STATUS_LABEL[key] || val, value: key}));

