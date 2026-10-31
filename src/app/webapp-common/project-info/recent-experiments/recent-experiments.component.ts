import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {RouterLink} from '@angular/router';
import {catchError, map, startWith, switchMap} from 'rxjs/operators';
import {Observable, of} from 'rxjs';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {StatusIconLabelComponent} from '@common/shared/experiment-status-icon-label/status-icon-label.component';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';

const LIMIT = 5;

export interface RecentExperiment {
  id: string;
  name: string;
  status: string;
  created: string;
}

type RecentState =
  | {state: 'loading'}
  | {state: 'error'}
  | {state: 'ready'; experiments: RecentExperiment[]};

/** The latest experiments of the project, newest first, each linked to its run. */
@Component({
  selector: 'sm-recent-experiments',
  templateUrl: './recent-experiments.component.html',
  styleUrls: ['./recent-experiments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, StatusIconLabelComponent, TimeAgoPipe]
})
export class RecentExperimentsComponent {
  private tasksApi = inject(ApiTasksService);

  projectId = input.required<string>();

  protected readonly experiments = computed(() => {
    const content = this.content();
    return content.state === 'ready' ? content.experiments : null;
  });

  protected readonly content = toSignal(
    toObservable(this.projectId).pipe(
      switchMap(projectId => this.load(projectId).pipe(
        catchError(() => of<RecentState>({state: 'error'})),
        startWith<RecentState>({state: 'loading'})
      ))
    ),
    {initialValue: {state: 'loading'} as RecentState}
  );

  private load(projectId: string): Observable<RecentState> {
    if (!projectId) {
      return of<RecentState>({state: 'loading'});
    }
    return this.tasksApi.tasksGetAllEx({
      project: [projectId],
      order_by: ['-created'],
      only_fields: ['name', 'status', 'created'],
      system_tags: ['-pipeline', '-dataset'],
      page: 0,
      page_size: LIMIT
    }).pipe(
      map(response => ({
        state: 'ready',
        experiments: ((response?.tasks ?? []) as {id: string; name: string; status: string; created: string}[])
          .map(task => ({id: task.id, name: task.name, status: task.status, created: task.created}))
      }) as RecentState)
    );
  }
}
