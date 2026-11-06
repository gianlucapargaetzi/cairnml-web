import {ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {lastValueFrom} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {Store} from '@ngrx/store';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {selectCurrentUserId} from '@common/core/reducers/users-reducer';
import {
  AccessDataset,
  DATASET_VISIBILITY_LABELS,
  DatasetAccessService,
  DatasetVisibility
} from '@common/datasets/dataset-git/dataset-access.service';
import {ProjectSettingsStore} from '~/features/dashboard-search/project-settings-dashboard-search-permissions.store';
import {
  AddProjectDatasetsDialogComponent,
  AddProjectDatasetsDialogData,
  AddProjectDatasetsResult
} from './add-project-datasets-dialog/add-project-datasets-dialog.component';
import {SHARE_LEVEL_LABELS} from '@common/shared/ui-components/inputs/share-control/share-control.component';
import {AccessDatasetProjectShare} from '@common/datasets/dataset-git/dataset-access.service';
import {ProjectShareService} from '../project-share.service';

// An App-discovered repository that the server keeps no record of has an id of this form. It cannot be shared until
// the server keeps it as a dataset, so it is not offered.
const APP_ROW_PREFIX = 'app:';


/**
 * The datasets shared with a project, with the level of each share. A member shares a dataset they can see. The owner
 * and collaborators of the project, the owner of a dataset and admins take a share back, through access.unshare; the
 * credential that reads the dataset is shared with the project at the same time.
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
  protected readonly visible = signal<AccessDataset[]>([]);
  protected readonly datasets = computed(() => this.visible().filter(d => d.projects.includes(this.projectId())));
  protected readonly error = signal<string>(null);
  protected readonly busy = signal(false);

  ngOnInit() {
    this.load();
  }

  protected visibilityLabel(visibility: DatasetVisibility): string {
    return DATASET_VISIBILITY_LABELS[visibility] ?? visibility;
  }

  // The share of the dataset with this project: its level, its share id and whether a run made it.
  protected shareOf(row: AccessDataset): AccessDatasetProjectShare | undefined {
    return row.project_shares?.find(share => share.project === this.projectId());
  }

  protected levelLabel(share?: AccessDatasetProjectShare): string {
    return share ? (SHARE_LEVEL_LABELS[share.level] ?? share.level) : '';
  }

  // The project's stewards (owner, collaborators, admins) and the owner of the dataset may take a share back.
  protected canRevoke(row: AccessDataset): boolean {
    return !!this.shareOf(row)
      && (this.settingsStore.canManageMembers() || row.owner === this.currentUserId());
  }

  protected async load() {
    try {
      this.visible.set(await lastValueFrom(this.datasetsApi.visible()));
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The datasets of the project could not be loaded.');
    }
  }

  // The datasets the user can share: their own, and public or shared-with-projects ones they can see that are not here yet.
  // Only rows with a record are offered (see APP_ROW_PREFIX).
  protected async addDatasets() {
    this.error.set(null);
    const shared = new Set(this.datasets().map(d => d.id));
    const available = this.visible().filter(d => !d.id.startsWith(APP_ROW_PREFIX) && !shared.has(d.id)
      && (d.visibility !== 'user' || d.owner === this.currentUserId()));
    this.dialog.open<AddProjectDatasetsDialogComponent, AddProjectDatasetsDialogData, AddProjectDatasetsResult>(
      AddProjectDatasetsDialogComponent, {data: {datasets: available}, panelClass: 'dialog-sm'},
    ).afterClosed().subscribe(async result => {
      if (result?.ids?.length) {
        await this.run(async () => {
          for (const id of result.ids) {
            await lastValueFrom(this.datasetsApi.allocate(id, this.projectId()));
          }
        });
      }
    });
  }

  protected removeDataset(row: AccessDataset) {
    const share = this.shareOf(row);
    if (!share) {
      return;
    }
    this.error.set(null);
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(ConfirmDialogComponent, {
      data: {
        title: `Remove ${row.name}?`,
        body: 'The project loses this dataset. Its agents can no longer read it. The dataset itself is not changed.',
        yes: 'Remove',
        no: 'Cancel',
        iconClass: 'al-ico-dialog-x',
        destructive: true,
      },
      panelClass: 'dialog-sm',
    }).afterClosed().subscribe(async confirmed => {
      if (confirmed) {
        await this.run(() => lastValueFrom(this.shares.unshare(share.share_id)));
      }
    });
  }

  private async run(action: () => Promise<unknown>) {
    this.busy.set(true);
    try {
      await action();
      await this.load();
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? error?.message ?? 'The change could not be saved.');
    } finally {
      this.busy.set(false);
    }
  }
}
