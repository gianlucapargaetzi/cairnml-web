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
  DatasetAccessService,
  DatasetVisibility
} from '@common/datasets/dataset-git/dataset-access.service';
import {
  AddProjectDatasetsDialogComponent,
  AddProjectDatasetsDialogData,
  AddProjectDatasetsResult
} from './add-project-datasets-dialog/add-project-datasets-dialog.component';

const VISIBILITY_LABELS: Record<DatasetVisibility, string> = {
  user: 'User only',
  projects: 'Projects',
  Public: 'Public',
};

/**
 * The datasets shared with a project. A member shares a dataset they can see, and takes it back; the project then uses
 * the credential that reads the dataset, shared with it at the same time.
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
  private dialog = inject(MatDialog);
  private store = inject(Store);

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
    return VISIBILITY_LABELS[visibility] ?? visibility;
  }

  protected async load() {
    try {
      this.visible.set(await lastValueFrom(this.datasetsApi.visible()));
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The datasets of the project could not be loaded.');
    }
  }

  // The datasets the user can share: their own, and public or shared-with-projects ones they can see that are not here yet.
  protected async addDatasets() {
    this.error.set(null);
    const shared = new Set(this.datasets().map(d => d.id));
    const available = this.visible().filter(d => !shared.has(d.id)
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
    this.error.set(null);
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(ConfirmDialogComponent, {
      data: {
        title: `Remove ${row.name}?`,
        body: 'The project loses this dataset. Its jobs can no longer read it. The dataset itself is not changed.',
        yes: 'Remove',
        no: 'Cancel',
        iconClass: 'al-ico-dialog-x',
        destructive: true,
      },
      panelClass: 'dialog-sm',
    }).afterClosed().subscribe(async confirmed => {
      if (confirmed) {
        await this.run(() => lastValueFrom(this.datasetsApi.unallocate(row.id, this.projectId())));
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
