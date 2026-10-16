import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {map, switchMap} from 'rxjs/operators';
import {getTaskForEnqueue, setTaskForEnqueue} from './select-queue.actions';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';

@Injectable()
export class SelectQueueEffects {
  private actions$ = inject(Actions);
  private tasksApi = inject(ApiTasksService);

  getTaskForEnqueue$ = createEffect(() => this.actions$.pipe(
    ofType(getTaskForEnqueue),
    switchMap(action => this.tasksApi.tasksGetAllEx({
      id: action.taskIds,
      only_fields: ['status', 'script.repository', 'script.entry_point', 'script.diff']
    })),
    map(res => setTaskForEnqueue({tasks: res.tasks}))
  ));
}
