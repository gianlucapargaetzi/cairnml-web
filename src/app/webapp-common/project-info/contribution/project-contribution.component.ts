import {afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, input, signal} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {RouterLink} from '@angular/router';
import {catchError, map, startWith, switchMap} from 'rxjs/operators';
import {Observable, of, throwError} from 'rxjs';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {HTTP} from '~/app.constants';
import {encodeFilters} from '@common/shared/utils/tableParamEncode';
import {EXPERIMENTS_TABLE_COL_FIELDS} from '~/features/experiments/shared/experiments.const';
import {FilterMetadata} from 'primeng/api';
import {Task} from '~/business-logic/model/tasks/task';
import {
  buildContributionSummary,
  buildContributionSummaryFromAggregate,
  buildWeeks,
  periodDaysFor,
  ContributionAggregate,
  ContributionRun,
  ContributionSummary,
  periodStart,
  utcOffsetMinutes
} from '@common/project-info/contribution/contribution-stats';

const PAGE_SIZE = 500;
// Layout of the activity grid, in pixels. They match the styles of the panel: the cells, the gap between them, the
// weekday labels with their gap, and the panel's padding and border.
const CELL_PX = 12;
const CELL_GAP_PX = 3;
const WEEKDAY_COLUMN_PX = 36;
const PANEL_CHROME_PX = 34;
const DEFAULT_COLUMNS = 53;
const ONLY_FIELDS = ['created', 'status', 'user.name'];
const UNKNOWN_USER = 'Unknown user';

/**
 * Set when the server does not know `projects.get_contributions` (a server older than API 2.39).
 * The panel then counts the runs in the browser for the rest of the session.
 */
let contributionsEndpointMissing = false;

/** The number of weeks whose cells fit in the width of the panel. */
function columnsFor(hostWidth: number): number {
  const available = hostWidth - PANEL_CHROME_PX - WEEKDAY_COLUMN_PX;
  return Math.max(1, Math.floor((available + CELL_GAP_PX) / (CELL_PX + CELL_GAP_PX)));
}

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
  private apiRequest = inject(SmApiRequestsService);

  projectId = input.required<string>();
  topContributors = input(5);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Weeks that fit the width of the panel, one column per week. */
  protected readonly columns = signal(DEFAULT_COLUMNS);

  constructor() {
    const updateColumns = () => this.columns.set(columnsFor(this.host.nativeElement.clientWidth));
    afterNextRender(() => {
      const observer = new ResizeObserver(updateColumns);
      observer.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
      updateColumns();
    });
  }

  private readonly destroyRef = inject(DestroyRef);

  /** The period the panel counts: the weeks that fit its width, as the grid shows them. */
  protected readonly periodDays = computed(() => periodDaysFor(this.columns(), new Date()));
  protected readonly periodLabel = computed(() => `Last ${Math.ceil(this.periodDays() / 7)} weeks`);

  private readonly query = computed(() => ({
    projectId: this.projectId(),
    periodDays: this.periodDays(),
    topContributors: this.topContributors()
  }));

  protected readonly content = toSignal(
    toObservable(this.query).pipe(
      switchMap(({projectId, periodDays, topContributors}) => this.loadSummary(projectId, periodDays, topContributors).pipe(
        map((summary): ContributionState => ({state: 'ready', summary})),
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

  protected readonly weeks = computed(() => {
    const summary = this.summary();
    return summary ? buildWeeks(summary.days, this.columns(), new Date()) : [];
  });

  protected userFilterLink(userId: string) {
    return {filter: encodeFilters({[EXPERIMENTS_TABLE_COL_FIELDS.USER]: {value: [userId]} as FilterMetadata})};
  }

  /** The counts come from the server. Servers without the endpoint get the counts computed in the browser. */
  private loadSummary(projectId: string, periodDays: number, topContributors: number): Observable<ContributionSummary> {
    if (contributionsEndpointMissing) {
      return this.loadSummaryFromTasks(projectId, periodDays, topContributors);
    }
    return this.apiRequest.post<ContributionAggregate>(`${HTTP.API_BASE_URL}/projects.get_contributions`, {
      project: projectId,
      period_days: periodDays,
      utc_offset_minutes: utcOffsetMinutes(new Date()),
      limit: topContributors
    }, {}).pipe(
      map(aggregate => buildContributionSummaryFromAggregate(aggregate, new Date(), periodDays, topContributors)),
      catchError(error => {
        if (error?.status === 404) {
          contributionsEndpointMissing = true;
          return this.loadSummaryFromTasks(projectId, periodDays, topContributors);
        }
        return throwError(() => error);
      })
    );
  }

  private loadSummaryFromTasks(projectId: string, periodDays: number, topContributors: number): Observable<ContributionSummary> {
    return this.loadRuns(projectId, periodDays).pipe(
      map(runs => buildContributionSummary(runs, new Date(), periodDays, topContributors))
    );
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
