import {ChangeDetectionStrategy, Component, computed, effect, inject, resource, untracked} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {RouterLink} from '@angular/router';
import {DatePipe} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
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

const FOLDER_COLUMNS: ISmCol[] = [
  {id: 'task', header: 'TASK', style: {minWidth: '240px'}},
  {id: 'count', header: 'EXPERIMENTS', style: {width: '130px'}},
  {id: 'latest', header: 'LATEST RUN', style: {width: '200px'}},
  {id: 'status', header: 'LATEST STATUS', style: {width: '170px'}},
];

interface FolderRow {
  id: string;
  name: string;
  unassigned: boolean;
  count: number;
  latest: FolderExperiment;
}

@Component({
  selector: 'sm-task-folders',
  templateUrl: './task-folders.component.html',
  styleUrls: ['./task-folders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, MatButtonModule, MatProgressSpinnerModule, PrimeTemplate, TableComponent, CardComponent, CircleStatusComponent],
})
export class TaskFoldersComponent {
  private api = inject(TaskFoldersApiService);
  private store = inject(Store);
  private headerMenu = inject(HeaderMenuService);

  protected readonly projectId = toSignal(this.store.select(selectRouterParams).pipe(map(params => params?.projectId ?? '')), {initialValue: ''});
  protected readonly experiments = resource({
    params: () => this.projectId() || undefined,
    loader: ({params}) => this.api.loadExperiments(params),
  });
  protected readonly columns = FOLDER_COLUMNS;
  protected readonly grouped = computed(() => groupTaskFolders(this.experiments.value() ?? []));
  protected readonly totals = computed(() => ({
    folders: this.grouped().folders.length,
    experiments: (this.experiments.value() ?? []).length,
    unassigned: this.grouped().unassigned.length,
  }));

  // rows need a unique id (the table marks a row selected by its id)
  protected readonly rows = computed<FolderRow[]>(() => {
    const {folders, unassigned} = this.grouped();
    const rows: FolderRow[] = folders.map(folder => ({
      id: folder.name,
      name: folder.name,
      unassigned: false,
      count: folder.experiments.length,
      latest: folder.experiments[0],
    }));
    if (unassigned.length) {
      rows.push({id: UNASSIGNED_FOLDER, name: UNASSIGNED_LABEL, unassigned: true, count: unassigned.length, latest: unassigned[0]});
    }
    return rows;
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

  protected folderLink(row: FolderRow): string[] {
    return [row.unassigned ? UNASSIGNED_FOLDER : row.name];
  }

  protected allExperimentsLink(): string[] {
    return ['/projects', this.projectId(), 'tasks'];
  }
}
