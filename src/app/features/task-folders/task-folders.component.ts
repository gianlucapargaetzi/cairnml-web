import {ChangeDetectionStrategy, Component, computed, effect, inject, resource, untracked} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {DatePipe} from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {Store} from '@ngrx/store';
import {map} from 'rxjs/operators';
import {setBreadcrumbsOptions} from '@common/core/actions/projects.actions';
import {selectRouterParams} from '@common/core/reducers/router-reducer';
import {IRecentTask} from '@common/dashboard/common-dashboard.reducer';
import {DashboardExperimentsComponent} from '@common/dashboard/containers/dashboard-experiments/dashboard-experiments.component';
import {CardComponent} from '@common/shared/ui-components/panel/card/card.component';
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
  latest?: FolderExperiment;
}

@Component({
  selector: 'sm-task-folders',
  templateUrl: './task-folders.component.html',
  styleUrls: ['./task-folders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, MatButtonModule, MatProgressSpinnerModule, CardComponent, DashboardExperimentsComponent],
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
    const cards: FolderCard[] = folders.map((folder: TaskFolder<FolderExperiment>) => ({
      id: folder.name,
      name: folder.name,
      unassigned: false,
      count: folder.experiments.length,
      latest: folder.experiments[0],
    }));
    if (unassigned.length) {
      cards.push({id: UNASSIGNED_FOLDER, name: UNASSIGNED_LABEL, unassigned: true, count: unassigned.length, latest: unassigned[0]});
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
    this.store.dispatch(setBreadcrumbsOptions({
      breadcrumbOptions: {showProjects: true, featureBreadcrumb: {name: 'Tasks', url: 'folders'}},
    }));
  }

  /** Double-click opens the task's folder, as double-clicking a project opens the project. */
  protected openFolder(folder: FolderCard) {
    this.router.navigate(['/projects', this.projectId(), 'folders', folder.unassigned ? UNASSIGNED_FOLDER : folder.name]);
  }

  protected allExperimentsLink(): string[] {
    return ['/projects', this.projectId(), 'tasks'];
  }
}
