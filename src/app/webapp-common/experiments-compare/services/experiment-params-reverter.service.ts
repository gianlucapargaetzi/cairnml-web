import {Injectable} from '@angular/core';
import {experimentLabel} from '@common/experiments/shared/experiment-label';
import {ITask} from '../../../business-logic/model/al-task';


@Injectable({
  providedIn: 'root'
})
export class ExperimentParamsReverterService {

  constructor() {
  }

  revertExperiments(experimentIds: string[], experiments: ITask[]) {
    // map the experiment ids to keep the user order.
    return experimentIds.map(id => {
      const exp = experiments.find(ex => ex.id === id);
      return {
        id: exp.id,
        name: experimentLabel(exp),
        status: exp.status,
        last_iteration: exp.last_iteration,
        last_update: exp.last_update,
        project: exp.project,
        completed: exp.completed,
        tags: exp.tags,
        hyperparams: exp?.hyperparams ?? {},
      };
    });
  }
}
