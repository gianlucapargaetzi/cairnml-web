import {ParamsItem} from '~/business-logic/model/tasks/paramsItem';

export type IHyperParamsForm = Record<string, ParamsItem[]>;;



export interface IExecutionParameter {
  id?: string;
  label: any;
  key: string;
}
