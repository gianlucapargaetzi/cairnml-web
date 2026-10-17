import {ChangeDetectionStrategy, Component, computed, effect, inject, resource, untracked} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {DatePipe} from '@angular/common';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {PrimeTemplate} from 'primeng/api';
import {Store} from '@ngrx/store';
import {map} from 'rxjs/operators';
import {setBreadcrumbsOptions} from '@common/core/actions/projects.actions';
import {selectRouterParams} from '@common/core/reducers/router-reducer';
import {HeaderMenuService} from '~/shared/services/header-menu.service';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {CardComponent} from '@common/shared/ui-components/panel/card/card.component';
import {CircleStatusComponent} from '@common/shared/ui-components/indicators/circle-status/circle-status.component';
import {groupTaskFolders} from '@common/tasks/task-folders.utils';
import {FolderExperiment, TaskFoldersApiService} from './task-folders-api.service';
import {UNASSIGNED_FOLDER, UNASSIGNED_LABEL} from './task-folders.consts';

const EXPERIMENT_COLUMNS: ISmCol[] = [
  {id: 'number', header: '#', style: {width: '80px'}},
  {id: 'name', header: 'EXPERIMENT', style: {minWidth: '240px'}},
  {id: 'status', header: 'STATUS', style: {width: '170px'}},
  {id: 'created', header: 'CREATED', style: {width: '200px'}},
  {id: 'user', header: 'USER', style: {width: '160px'}},
  {id: 'updated', header: 'LAST UPDATE', style: {width: '200px'}},
];

interface ExperimentRow extends FolderExperiment {
  number: string;
}

@Component({
  selector: 'sm-task-folder',
  templateUrl: './task-folder.component.html',
  styleUrls: ['./task-folders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, MatProgressSpinnerModule, PrimeTemplate, TableComponent, CardComponent, CircleStatusComponent],
})
export class TaskFolderComponent {
  private api = inject(TaskFoldersApiService);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private headerMenu = inject(HeaderMenuService);

  protected readonly projectId = toSignal(this.store.select(selectRouterParams).pipe(map(params => params?.projectId ?? '')), {initialValue: ''});
  protected readonly folder = toSignal(this.route.paramMap.pipe(map(params => params.get('folder') ?? '')), {initialValue: ''});
  protected readonly isUnassigned = computed(() => this.folder() === UNASSIGNED_FOLDER);
  protected readonly folderName = computed(() => this.isUnassigned() ? UNASSIGNED_LABEL : this.folder());
  protected readonly columns = EXPERIMENT_COLUMNS;

  protected readonly experiments = resource({
    params: () => this.projectId() || undefined,
    loader: ({params}) => this.api.loadExperiments(params),
  });

  // The experiments of this task, numbered in the order they were created. Rows need a unique id.
  protected readonly rows = computed<ExperimentRow[]>(() => {
    const grouped = groupTaskFolders(this.experiments.value() ?? []);
    const members = this.isUnassigned()
      ? grouped.unassigned
      : grouped.folders.find(folder => folder.name === this.folder())?.experiments ?? [];
    const oldestFirst = [...members].reverse();
    return oldestFirst.map((experiment, index) => ({
      ...experiment,
      number: String(index + 1).padStart(3, '0'),
    })).reverse();
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
    effect(() => {
      const name = this.folderName();
      untracked(() => this.store.dispatch(setBreadcrumbsOptions({
        breadcrumbOptions: {
          showProjects: true,
          featureBreadcrumb: {name: 'Tasks', url: 'folders'},
          subFeatureBreadcrumb: {name},
        },
      })));
    });
  }

  protected experimentLink(row: ExperimentRow): string[] {
    return ['/projects', this.projectId(), 'tasks', row.id];
  }
}
