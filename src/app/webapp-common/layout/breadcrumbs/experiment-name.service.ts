import {inject, Injectable} from '@angular/core';
import {firstValueFrom} from 'rxjs';
import {experimentLabel} from '@common/experiments/shared/experiment-label';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';

/** Looks up the names of experiments for the page titles, once per experiment. */
@Injectable({providedIn: 'root'})
export class ExperimentNameService {
  private tasks = inject(ApiTasksService);
  private names = new Map<string, Promise<string>>();

  /** The experiment's title (its display name, otherwise its task name), or its id when the experiment cannot be found. */
  nameOf(experimentId: string): Promise<string> {
    if (!this.names.has(experimentId)) {
      this.names.set(experimentId, this.fetchName(experimentId));
    }
    return this.names.get(experimentId);
  }

  private async fetchName(experimentId: string): Promise<string> {
    const response = await firstValueFrom(this.tasks.tasksGetAllEx({
      id: [experimentId],
      only_fields: ['name', 'display_name'],
      page_size: 1,
    }));
    return experimentLabel(response?.tasks?.[0]) || experimentId;
  }
}
