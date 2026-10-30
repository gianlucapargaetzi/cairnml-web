import {ChangeDetectionStrategy, Component, inject, input, OnInit, signal} from '@angular/core';
import {lastValueFrom} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {ProjectsQueueSummary} from '~/business-logic/model/projects/projectsQueueSummary';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {ProjectSettingsStore} from '~/features/dashboard-search/project-settings-dashboard-search-permissions.store';
import {
  AddProjectQueuesDialogComponent,
  AddProjectQueuesDialogData,
  AddProjectQueuesResult
} from './add-project-queues-dialog/add-project-queues-dialog.component';

/**
 * The queues allocated to a project. Only the owner allocates and removes them; members see the list.
 */
@Component({
  selector: 'sm-project-queues',
  templateUrl: './project-queues.component.html',
  styleUrls: ['./project-queues.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButton, MatIcon, MatIconButton, TooltipDirective]
})
export class ProjectQueuesComponent implements OnInit {
  private projectsApi = inject(ApiProjectsService);
  private dialog = inject(MatDialog);
  protected settingsStore = inject(ProjectSettingsStore);

  projectId = input.required<string>();

  protected queues = signal<ProjectsQueueSummary[]>([]);
  protected error = signal<string>(null);
  protected busy = signal(false);

  ngOnInit() {
    this.load();
  }

  protected async load() {
    try {
      const res = await lastValueFrom(this.projectsApi.projectsGetQueues({project: this.projectId()}));
      this.queues.set(res.queues ?? []);
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The queues of the project could not be loaded.');
    }
  }

  protected async addQueues() {
    this.error.set(null);
    const assignable = await lastValueFrom(this.projectsApi.projectsGetAssignableQueues({project: this.projectId()}));
    const allocated = new Set(this.queues().map(q => q.id));
    const available = (assignable.queues ?? []).filter(q => !allocated.has(q.id));
    this.dialog.open<AddProjectQueuesDialogComponent, AddProjectQueuesDialogData, AddProjectQueuesResult>(AddProjectQueuesDialogComponent, {
      data: {queues: available},
      panelClass: 'dialog-sm',
    }).afterClosed().subscribe(async result => {
      if (result?.queues?.length) {
        await this.run(() => lastValueFrom(this.projectsApi.projectsAddQueues({project: this.projectId(), queues: result.queues})));
      }
    });
  }

  protected removeQueue(row: ProjectsQueueSummary) {
    this.error.set(null);
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(ConfirmDialogComponent, {
      data: {
        title: `Remove ${row.name}?`,
        body: 'The project loses this queue. Jobs of the project can no longer run on it, unless another queue is allocated.',
        yes: 'Remove',
        no: 'Cancel',
        iconClass: 'al-ico-dialog-x',
        destructive: true,
      },
      panelClass: 'dialog-sm',
    }).afterClosed().subscribe(async confirmed => {
      if (confirmed) {
        await this.run(() => lastValueFrom(this.projectsApi.projectsRemoveQueue({project: this.projectId(), queue: row.id})));
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
