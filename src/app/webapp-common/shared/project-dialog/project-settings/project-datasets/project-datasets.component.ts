import {ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal} from '@angular/core';
import {lastValueFrom} from 'rxjs';
import {toSignal} from '@angular/core/rxjs-interop';
import {Store} from '@ngrx/store';
import {MatDialog} from '@angular/material/dialog';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {selectCurrentUserId} from '@common/core/reducers/users-reducer';
import {SHARE_LEVEL_LABELS} from '@common/shared/ui-components/inputs/share-control/share-control.component';
import {AccessDataset, DatasetAccessService} from '@common/datasets/dataset-git/dataset-access.service';
import {ProjectSettingsStore} from '~/features/dashboard-search/project-settings-dashboard-search-permissions.store';
import {
  AddProjectDatasetsDialogComponent,
  AddProjectDatasetsDialogData,
  AddProjectDatasetsResult
} from './add-project-datasets-dialog/add-project-datasets-dialog.component';
import {ProjectShareService, ProjectUsableDataset} from '../project-share.service';

// An App-discovered repository that the server keeps no record of has an id of this form. It cannot be shared until
// the server keeps it as a dataset, so it is not offered.
const APP_ROW_PREFIX = 'app:';

// A row of the table: a dataset already usable by the project, or one added here and not saved yet.
interface DatasetRow {
  key: string;
  name: string;
  owner: string;
  scope: 'public' | 'project';
  level: string;
  inherited: boolean;
  removable: boolean;
  // set for a usable dataset: the share a removal takes
  usable?: ProjectUsableDataset;
}

/**
 * The datasets a project can use: the public ones and the ones shared with the project. The owner and collaborators of
 * the project add a dataset, and remove a share they may remove; the changes are applied with Save. Members do not see
 * the section.
 */
@Component({
  selector: 'sm-project-datasets',
  templateUrl: './project-datasets.component.html',
  styleUrls: ['./project-datasets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButton, MatIcon, MatIconButton, TooltipDirective],
})
export class ProjectDatasetsComponent implements OnInit {
  private datasetsApi = inject(DatasetAccessService);
  private shares = inject(ProjectShareService);
  private dialog = inject(MatDialog);
  private store = inject(Store);
  protected settingsStore = inject(ProjectSettingsStore);

  projectId = input.required<string>();

  protected readonly currentUserId = toSignal(this.store.select(selectCurrentUserId), {initialValue: null});
  protected readonly usable = signal<ProjectUsableDataset[]>([]);
  // from projects.usable: the server decides who may add and remove the shares of the project
  protected readonly canManage = signal(false);
  // datasets picked in the add dialog, not saved yet
  protected readonly pendingAdd = signal<AccessDataset[]>([]);
  // share ids of usable datasets to remove on Save
  protected readonly pendingRemove = signal<string[]>([]);
  protected readonly error = signal<string>(null);
  protected readonly busy = signal(false);
  protected readonly dirty = computed(() => this.pendingAdd().length > 0 || this.pendingRemove().length > 0);

  protected readonly rows = computed<DatasetRow[]>(() => {
    const removed = new Set(this.pendingRemove());
    const kept: DatasetRow[] = this.usable()
      .filter(dataset => !removed.has(dataset.share_id))
      .map(dataset => ({
        key: dataset.id,
        name: dataset.name,
        owner: this.ownerName(dataset.owner, dataset.owner_name),
        scope: dataset.scope,
        level: SHARE_LEVEL_LABELS[dataset.level] ?? dataset.level,
        inherited: dataset.inherited,
        removable: dataset.removable,
        usable: dataset,
      }));
    const added: DatasetRow[] = this.pendingAdd().map(dataset => ({
      key: dataset.id,
      name: dataset.name,
      owner: this.ownerName(dataset.owner, null),
      scope: 'project',
      level: SHARE_LEVEL_LABELS.read,
      inherited: false,
      removable: true,
    }));
    return [...kept, ...added];
  });

  ngOnInit() {
    this.load();
  }

  protected scopeLabel(scope: 'public' | 'project'): string {
    return scope === 'public' ? 'Public' : 'Project';
  }

  protected ownerName(id: string, name: string | null): string {
    return name ?? this.settingsStore.companyUsers().find(user => user.id === id)?.name ?? id;
  }

  protected async load() {
    this.error.set(null);
    try {
      const res = await lastValueFrom(this.shares.usable(this.projectId()));
      this.canManage.set(res.can_manage);
      this.usable.set(res.datasets);
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The datasets of the project could not be loaded.');
    }
  }

  // The datasets the user can add: their own, and public or shared-with-projects ones they can see that the project does
  // not use yet. Only rows with a record are offered (see APP_ROW_PREFIX).
  protected async addDatasets() {
    this.error.set(null);
    const current = new Set(this.rows().map(row => row.key));
    const visible = await lastValueFrom(this.datasetsApi.visible());
    const available = visible.filter(d => !d.id.startsWith(APP_ROW_PREFIX) && !current.has(d.id)
      && (d.visibility !== 'user' || d.owner === this.currentUserId()));
    this.dialog.open<AddProjectDatasetsDialogComponent, AddProjectDatasetsDialogData, AddProjectDatasetsResult>(
      AddProjectDatasetsDialogComponent, {data: {datasets: available}, panelClass: 'dialog-sm'},
    ).afterClosed().subscribe(result => {
      if (result?.ids?.length) {
        const picked = available.filter(d => result.ids.includes(d.id));
        this.pendingAdd.update(items => [...items, ...picked.filter(d => !items.some(item => item.id === d.id))]);
      }
    });
  }

  // A saved share is removed on Save after a confirmation; a dataset added here and not saved yet is only dropped.
  protected removeRow(row: DatasetRow) {
    if (!row.usable) {
      this.pendingAdd.update(items => items.filter(item => item.id !== row.key));
      return;
    }
    const shareId = row.usable.share_id;
    if (!shareId) {
      return;
    }
    this.error.set(null);
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(ConfirmDialogComponent, {
      data: {
        title: `Remove ${row.name}?`,
        body: 'The project loses this dataset when you save. Its agents can no longer read it. The dataset itself is not changed.',
        yes: 'Remove',
        no: 'Cancel',
        iconClass: 'al-ico-dialog-x',
        destructive: true,
      },
      panelClass: 'dialog-sm',
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.pendingRemove.update(ids => [...ids, shareId]);
      }
    });
  }

  protected async save() {
    this.busy.set(true);
    this.error.set(null);
    try {
      for (const dataset of this.pendingAdd()) {
        await lastValueFrom(this.shares.allocateDataset(dataset.id, this.projectId()));
      }
      for (const shareId of this.pendingRemove()) {
        await lastValueFrom(this.shares.unshare(shareId));
      }
      this.pendingAdd.set([]);
      this.pendingRemove.set([]);
      await this.load();
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? error?.message ?? 'The change could not be saved.');
    } finally {
      this.busy.set(false);
    }
  }
}
