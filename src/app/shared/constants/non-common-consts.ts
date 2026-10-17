import {TaskStatusEnum} from '~/business-logic/model/tasks/taskStatusEnum';
import {TaskTypeEnum} from '~/business-logic/model/tasks/taskTypeEnum';

export enum EntityTypeEnum {
  experiment = 'task',
  model = 'model',
  project = 'project',
  pipeline = 'pipeline',
  controller = 'pipeline run',
  dataset = 'version',
  openDataset = 'dataset',
  report = 'report',
  endpoint = 'endpoint',
  endpointsContainer = 'endpoints container'
}

/**
 * The name of an entity type in text shown to people. The enum value for an experiment is `task`, because
 * that is what the API calls it; in the UI a run is an experiment (a task is the procedure it belongs to).
 */
export const entityDisplayName = (entityType: string): string => (entityType === EntityTypeEnum.experiment ? 'experiment' : entityType);

export enum CircleTypeEnum {
  completed = 'completed',
  running = 'running',
  pending = 'pending',
  failed = 'failed',
  empty = 'empty',
  total = 'total',
  published = 'published',
  'model-labels' = 'model-labels'
}

export const EXPERIMENTS_TYPE_LABELS = {
  [TaskStatusEnum.Created]     : 'Draft',
  [TaskStatusEnum.Queued]      : 'Pending',
  [TaskStatusEnum.InProgress]  : 'Running',
  [TaskStatusEnum.Completed]   : 'Completed',
  [TaskStatusEnum.Published]   : 'Published',
  [TaskStatusEnum.Failed]      : 'Failed',
  [TaskStatusEnum.Stopped]     : 'Aborted',
  [TaskStatusEnum.Closed]      : 'Closed',
  [TaskTypeEnum.Testing]       : 'Testing',
  [TaskTypeEnum.Training]      : 'Training',
  [TaskTypeEnum.Inference]     : 'Inference',
  [TaskTypeEnum.DataProcessing]: 'Data Processing',
  [TaskTypeEnum.Application]   : 'Application',
  [TaskTypeEnum.Monitor]       : 'Monitor',
  [TaskTypeEnum.Controller]    : 'Controller',
  [TaskTypeEnum.Optimizer]     : 'Optimizer',
  [TaskTypeEnum.Service]       : 'Service',
  [TaskTypeEnum.Qc]            : 'QC',
  [TaskTypeEnum.Custom]        : 'Custom'
};

export const hideDeleteArtifactsEntities = [EntityTypeEnum.model];

export const cloneExtraToggles = () => ['force original packages'];
export const cloneExtraActions = (data: unknown) => ({});
