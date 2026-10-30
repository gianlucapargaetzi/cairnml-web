import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {RouterLink} from '@angular/router';
import {catchError, map, startWith, switchMap} from 'rxjs/operators';
import {Observable, of} from 'rxjs';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {encodeFilters} from '@common/shared/utils/tableParamEncode';
import {EXPERIMENTS_TABLE_COL_FIELDS} from '~/features/experiments/shared/experiments.const';
import {FilterMetadata} from 'primeng/api';
import {Task} from '~/business-logic/model/tasks/task';
import {
  buildContributionSummary,
  ContributionRun,
  ContributionSummary,
  periodStart
} from '@common/project-info/contribution/contribution-stats';

const PAGE_SIZE = 500;
const ONLY_FIELDS = ['created', 'status', 'user.name'];
const UNKNOWN_USER = 'Unknown user';

type ContributionState =
  | {state: 'loading'}
  | {state: 'error'}
  | {state: 'ready'; summary: ContributionSummary};

@Component({
  selector: 'sm-project-contribution',
  templateUrl: './project-contribution.component.html',
  styleUrls: ['./project-contribution.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink]
})
export class ProjectContributionComponent {
  private tasksApi = inject(ApiTasksService);

  projectId = input.required<string>();
  periodDays = input(30);
  topContributors = input(5);

  protected readonly periodLabel = computed(() => `Last ${this.periodDays()} days`);

  private readonly query = computed(() => ({
    projectId: this.projectId(),
    periodDays: this.periodDays(),
    topContributors: this.topContributors()
  }));

  protected readonly content = toSignal(
    toObservable(this.query).pipe(
      switchMap(({projectId, periodDays, topContributors}) => this.loadRuns(projectId, periodDays).pipe(
        map((runs): ContributionState => ({
          state: 'ready',
          summary: buildContributionSummary(runs, new Date(), periodDays, topContributors)
        })),
        catchError(() => of<ContributionState>({state: 'error'})),
        startWith<ContributionState>({state: 'loading'})
      ))
    ),
    {initialValue: {state: 'loading'} as ContributionState}
  );

  protected readonly state = computed(() => this.content().state);
  protected readonly summary = computed(() => {
    const content = this.content();
    return content.state === 'ready' ? content.summary : null;
  });

  protected userFilterLink(userId: string) {
    return {filter: encodeFilters({[EXPERIMENTS_TABLE_COL_FIELDS.USER]: {value: [userId]} as FilterMetadata})};
  }

  /**
   * Runs of the project created since the start of the period, newest first.
   * Pages stop at the first run older than the period, so only the runs of the period are loaded.
   */
  private loadRuns(projectId: string, periodDays: number): Observable<ContributionRun[]> {
    const since = periodStart(new Date(), periodDays);
    const fetchPage = (page: number, collected: ContributionRun[]): Observable<ContributionRun[]> =>
      this.tasksApi.tasksGetAllEx({
        project: [projectId],
        order_by: ['-created'],
        only_fields: ONLY_FIELDS,
        page,
        page_size: PAGE_SIZE
      }).pipe(
        switchMap(response => {
          // `user` is returned as an object when `user.name` is projected, although the model types it as an id.
          const tasks: (Pick<Task, 'created' | 'status'> & {user?: {id?: string; name?: string}})[] = response?.tasks ?? [];
          const runs = tasks
            .filter(task => !!task.created)
            .map(task => ({
              created: new Date(task.created),
              status: task.status,
              userId: task.user?.id ?? '',
              userName: task.user?.name ?? UNKNOWN_USER
            }));
          const all = collected.concat(runs);
          const reachedPeriodStart = runs.length > 0 && runs[runs.length - 1].created < since;
          const lastPage = tasks.length < PAGE_SIZE;
          return reachedPeriodStart || lastPage
            ? of(all.filter(run => run.created >= since))
            : fetchPage(page + 1, all);
        })
      );
    return fetchPage(0, []);
  }
}
