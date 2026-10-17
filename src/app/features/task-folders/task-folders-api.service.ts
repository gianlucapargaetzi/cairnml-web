import {inject, Injectable} from '@angular/core';
import {firstValueFrom} from 'rxjs';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {TaskStatusEnum} from '~/business-logic/model/tasks/taskStatusEnum';

/** One experiment (a run of a task), with the fields the task folders need. */
export interface FolderExperiment {
  id: string;
  name?: string;
  parent?: string;
  type?: string;
  status: TaskStatusEnum;
  created?: string;
  started?: string;
  last_update?: string;
  user?: { name?: string };
  project?: { id?: string; name?: string };
}

const PAGE_SIZE = 500;

const ONLY_FIELDS = ['id', 'name', 'parent', 'type', 'status', 'created', 'started', 'last_update', 'user.name', 'project.name'];

@Injectable({providedIn: 'root'})
export class TaskFoldersApiService {
  private tasks = inject(ApiTasksService);

  /** All experiments of a project, newest first. Pages until the server has no more. */
  async loadExperiments(projectId: string): Promise<FolderExperiment[]> {
    const experiments: FolderExperiment[] = [];
    for (let page = 0; ; page++) {
      const response = await firstValueFrom(this.tasks.tasksGetAllEx({
        project: [projectId],
        only_fields: ONLY_FIELDS,
        order_by: ['-created'],
        page,
        page_size: PAGE_SIZE,
      }));
      const batch: FolderExperiment[] = response?.tasks ?? [];
      experiments.push(...batch);
      if (batch.length < PAGE_SIZE) {
        return experiments;
      }
    }
  }
}
