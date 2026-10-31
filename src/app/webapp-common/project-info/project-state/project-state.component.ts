import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {catchError, map, startWith, switchMap} from 'rxjs/operators';
import {Observable, of} from 'rxjs';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {Project} from '~/business-logic/model/projects/project';
import {StatsStatusCount} from '~/business-logic/model/projects/statsStatusCount';
import {StatusIconLabelComponent} from '@common/shared/experiment-status-icon-label/status-icon-label.component';

/** The statuses listed for each kind of entity, in the order of the lifecycle. */
const RUN_STATUSES = ['created', 'queued', 'in_progress', 'completed', 'failed'];

type PipelineState =
  | {state: 'loading'}
  | {state: 'error'}
  | {state: 'ready'; counts: StatsStatusCount | null};

/**
 * The state of the project: how many experiments, pipelines and models it holds and how the runs are doing.
 * Experiment and model counts come with the project the overview already loads. The pipeline counts need one
 * request, because the project stats leave pipelines out.
 */
@Component({
  selector: 'sm-project-state',
  templateUrl: './project-state.component.html',
  styleUrls: ['./project-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusIconLabelComponent]
})
export class ProjectStateComponent {
  private projectsApi = inject(ApiProjectsService);

  project = input<Project>();

  protected readonly statuses = RUN_STATUSES;
  protected readonly experiments = computed(() => this.project()?.stats?.active ?? null);
  protected readonly archived = computed(() => this.project()?.stats?.archived?.total_tasks ?? 0);
  protected readonly models = computed(() => this.project()?.own_models ?? 0);
  private readonly projectId = computed(() => this.project()?.id);

  protected readonly pipelines = toSignal(
    toObservable(this.projectId).pipe(switchMap(projectId => this.loadPipelines(projectId))),
    {initialValue: {state: 'loading'} as PipelineState}
  );

  protected readonly pipelineCounts = computed(() => {
    const pipelines = this.pipelines();
    return pipelines.state === 'ready' ? pipelines.counts : null;
  });

  protected countOf(counts: StatsStatusCount | null, status: string): number {
    return counts?.status_count?.[status] ?? 0;
  }

  private loadPipelines(projectId: string): Observable<PipelineState> {
    if (!projectId) {
      return of<PipelineState>({state: 'loading'});
    }
    return this.projectsApi.projectsGetAllEx({
      id: [projectId],
      include_stats: true,
      include_stats_filter: {system_tags: ['pipeline']}
    }).pipe(
      map(response => ({state: 'ready', counts: response?.projects?.[0]?.stats?.active ?? null}) as PipelineState),
      catchError(() => of<PipelineState>({state: 'error'})),
      startWith<PipelineState>({state: 'loading'})
    );
  }
}
