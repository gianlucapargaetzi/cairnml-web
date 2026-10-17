import {ChangeDetectionStrategy, Component, computed, effect, inject, resource, untracked} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {DatePipe} from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {Store} from '@ngrx/store';
import {map} from 'rxjs/operators';
import {selectRouterParams} from '@common/core/reducers/router-reducer';
import {IRecentTask} from '@common/dashboard/common-dashboard.reducer';
import {DashboardExperimentsComponent} from '@common/dashboard/containers/dashboard-experiments/dashboard-experiments.component';
import {ProjectCardComponent} from '@common/shared/ui-components/panel/project-card/project-card.component';
import {Project} from '~/business-logic/model/projects/project';
import {groupTaskFolders, TaskFolder} from '@common/tasks/task-folders.utils';
import {HeaderMenuService} from '~/shared/services/header-menu.service';
import {FolderExperiment, TaskFoldersApiService} from './task-folders-api.service';
import {UNASSIGNED_FOLDER, UNASSIGNED_LABEL} from './task-folders.consts';

/** How many experiments the "recent" list at the bottom shows. */
const RECENT_LIMIT = 20;

interface FolderCard {
  id: string;
  name: string;
  unassigned: boolean;
  count: number;
  running: number;
  completed: number;
  /** Seconds from start to last update, summed over the experiments (an approximation of compute time). */
  runtimeSec: number;
  latest?: FolderExperiment;
}

@Component({
  selector: 'sm-task-folders',
  templateUrl: './task-folders.component.html',
  styleUrls: ['./task-folders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatProgressSpinnerModule, ProjectCardComponent, DashboardExperimentsComponent],
})
export class TaskFoldersComponent {
  private api = inject(TaskFoldersApiService);
  private store = inject(Store);
  private router = inject(Router);
  private headerMenu = inject(HeaderMenuService);

  protected readonly projectId = toSignal(this.store.select(selectRouterParams).pipe(map(params => params?.projectId ?? '')), {initialValue: ''});
  protected readonly experiments = resource({
    params: () => this.projectId() || undefined,
    loader: ({params}) => this.api.loadExperiments(params),
  });

  protected readonly grouped = computed(() => groupTaskFolders(this.experiments.value() ?? []));
  protected readonly experimentCount = computed(() => (this.experiments.value() ?? []).length);

  // rows need a unique id
  protected readonly folders = computed<FolderCard[]>(() => {
    const {folders, unassigned} = this.grouped();
    const cards: FolderCard[] = folders.map((folder: TaskFolder<FolderExperiment>) => this.toCard(folder.name, false, folder.experiments));
    if (unassigned.length) {
      cards.push(this.toCard(UNASSIGNED_LABEL, true, unassigned));
    }
    return cards;
  });

  /** The project's most recent experiments, in the shape the shared recent table shows. */
  protected readonly recent = computed<IRecentTask[]>(() => {
    const projectId = this.projectId();
    const newest = [...(this.experiments.value() ?? [])]
      .sort((a, b) => (b.last_update ?? '').localeCompare(a.last_update ?? ''))
      .slice(0, RECENT_LIMIT);
    return newest.map(experiment => ({
      ...experiment,
      project: {id: projectId, name: experiment.project?.name},
    }) as unknown as IRecentTask);
  });

  constructor() {
    effect(() => {
      const projectId = this.projectId();
      untracked(() => {
        if (projectId) {
          this.headerMenu.setupProjectHeaderTabs('folders', projectId, false);
        }
      });
    });
  }

  /** Double-click opens the task's folder, as double-clicking a project opens the project. */
  private toCard(name: string, unassigned: boolean, experiments: FolderExperiment[]): FolderCard {
    return {
      id: unassigned ? UNASSIGNED_FOLDER : name,
      name,
      unassigned,
      count: experiments.length,
      running: experiments.filter(e => e.status === 'in_progress').length,
      completed: experiments.filter(e => e.status === 'completed').length,
      runtimeSec: experiments.reduce((sum, e) => sum + this.seconds(e), 0),
      latest: experiments[0],
    };
  }

  /**
   * A folder as the Projects page shows a project: the same card, with the TOTAL, RUNNING and COMPLETED circles.
   * The card reads these counts from the project's stats.
   */
  protected asProjectCard(folder: FolderCard): Project {
    return {
      id: folder.id,
      name: folder.name,
      basename: folder.name,
      own_tasks: folder.count,
      sub_projects: [],
      // a company id keeps the card from showing the EXAMPLE ribbon
      company: {id: folder.id},
      stats: {
        active: {
          total_runtime: folder.runtimeSec,
          total_tasks: folder.count,
          status_count: {in_progress: folder.running},
          completed_tasks_24h: folder.completed,
        },
      },
    } as unknown as Project;
  }

  private seconds(experiment: FolderExperiment): number {
    if (!experiment.started || !experiment.last_update) {
      return 0;
    }
    return Math.max(0, (new Date(experiment.last_update).getTime() - new Date(experiment.started).getTime()) / 1000);
  }

  protected openFolder(folder: FolderCard) {
    this.router.navigate(['/projects', this.projectId(), 'folders', folder.unassigned ? UNASSIGNED_FOLDER : folder.name]);
  }

  protected allExperimentsLink(): string[] {
    return ['/projects', this.projectId(), 'tasks'];
  }
}
