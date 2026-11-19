import {Task} from '../../../business-logic/model/tasks/task';
import {Model} from '../../../business-logic/model/models/model';
import {User} from '../../../business-logic/model/users/user';
import {Project} from '../../../business-logic/model/projects/project';
import {IExecutionForm} from './experiment-execution.model';
import {IHyperParamsForm} from '../../../webapp-common/experiments/shared/experiment-hyper-params.model';
import {Artifact} from '../../../business-logic/model/tasks/artifact';
import {
  IExperimentModelInfo,
  IModelInfo
} from '../../../webapp-common/experiments/shared/common-experiment-model.model';
import {ParamsItem} from '../../../business-logic/model/tasks/paramsItem';
import {ConfigurationItem} from '../../../business-logic/model/tasks/configurationItem';
import {GetCurrentUserResponseUserObjectCompany} from '../../../business-logic/model/users/getCurrentUserResponseUserObjectCompany';
import {Queue} from '../../../business-logic/model/queues/queue';
import {Output} from '~/business-logic/model/tasks/output';

/**
 * an extended object of task that includes projection, will come from the server as an api response.
 */
export interface ISelectedExperiment extends Partial<Pick<Task,
  'name' | 'type' | 'status' | 'comment' | 'created' | 'completed' | 'started' | 'parent' | 'active_duration' | 'script' |
  'tags' | 'system_tags' | 'published' | 'status_changed' | 'status_message' | 'status_reason' | 'last_iteration' |
  'last_worker' | 'hyperparams' | 'configuration' | 'runtime'>> {
  id: string;
  user?: User;
  company?: GetCurrentUserResponseUserObjectCompany;
  last_update?: string | Date;
  project?: Project;
  input?: any; // TODO: fix projection...
  output?: ISelectedExperimentOutput;
  execution?: ISelectedExperimentExecution;
  currentUser?: any;
  models?: {input: {name: string; model: IModelInfo}[]; output: {name: string; model: IModelInfo}[]};
}

/**
 * an object that will transfrom from the ISelectedExperiment response to more comfortable object to display.
 */
export interface IExperimentInfo extends Omit<Task, 'id' | 'user' | 'project' | 'company' | 'execution' | 'container' | 'output' | 'last_update'> {
  id: string;
  last_update?: string | Date;
  model?: IExperimentModelInfo;
  execution?: IExecutionForm;
  hyperParams?: IHyperParamsForm;
  artifacts?: Artifact[];
  hyperparams?: Record<string, Record<string, ParamsItem>>;
  configuration?: Record<string, ConfigurationItem>;
  readonly?: boolean;
  user?: User;
  project?: Project;
  company?: GetCurrentUserResponseUserObjectCompany;
  container?: Record<string, string>;
  output?: ISelectedExperimentOutput
}

export interface ISelectedExperimentOutput extends Omit<Output, 'model'> {
  destination?: string;
  model?: {
    id: Model['id'];
    name: Model['name'];
    design?: Model['design'];
    framework?: Model['framework'];
  };
  result?: string;
  error?: string;
}

export interface ISelectedExperimentExecution {
  model?: {
    id: Model['id'];
    name: Model['name'];
    uri: Model['uri'];
    design?: Model['design'];
    created: Model['created'];
    labels: Model['labels'];
    task: {
      id: Task['id'];
      name: Task['name'];
    };
    project: {
      id: Project['id'];
      name: Project['name'];
    };
    user: {
      id: User['id'];
      name: User['name'];
    };
  };
  framework?: any;
  model_labels?: Record<string, number>;
  artifacts?: Artifact[];
  docker_cmd?: string;
  queue?: Queue;
}

export interface IExperimentInfoFormComponent {
  editable: boolean;
}
