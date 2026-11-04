import {ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal} from '@angular/core';
import {PrimeTemplate} from 'primeng/api';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {EmptyStateComponent} from '@common/shared/ui-components/feedback/empty-state/empty-state.component';
import {InlineAlertComponent} from '@common/shared/ui-components/feedback/inline-alert/inline-alert.component';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {lastValueFrom} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {HTTP} from '~/app.constants';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {Store} from '@ngrx/store';
import {addMessage} from '@common/core/actions/layout.actions';
import {MESSAGES_SEVERITY} from '@common/constants';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {ProjectSettingsStore} from '~/features/dashboard-search/project-settings-dashboard-search-permissions.store';

export interface ProjectGrantView {
  id: string;
  kind: 'token' | 'app';
  label: string;
  host: string;
  path: string;
  app_id: string | null;
  owner: string;
  owner_name: string;
  owner_active: boolean;
  owner_is_member: boolean;
}

// The accesses shared with this project. Members see who shared each one and whether it is still in effect; the
// owner of the project can stop a share. The secret of an access is never shown here.
@Component({
  selector: 'sm-project-accesses',
  templateUrl: './project-accesses.component.html',
  styleUrls: ['./project-accesses.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIcon, MatIconButton, TooltipDirective, TableComponent, PrimeTemplate, EmptyStateComponent, ShowTooltipIfEllipsisDirective, InlineAlertComponent],
})
export class ProjectAccessesComponent implements OnInit {
  private api = inject(SmApiRequestsService);
  private dialog = inject(MatDialog);
  private store = inject(Store);
  protected settingsStore = inject(ProjectSettingsStore);

  projectId = input.required<string>();

  protected grants = signal<ProjectGrantView[]>([]);

  protected readonly columns: ISmCol[] = [
    {id: 'label', header: 'Name', sortable: false},
    {id: 'reaches', header: 'Reaches', sortable: false},
    {id: 'owner', header: 'Shared by', sortable: false},
    {id: 'status', header: 'Status', sortable: false},
    {id: 'actions', header: '', sortable: false},
  ];
  protected readonly rows = computed(() => this.grants().map(grant => ({
    id: grant.id,
    label: grant.label,
    reaches: this.reaches(grant),
    owner: grant.owner_name,
    status: this.inEffect(grant) ? 'In use' : 'Not in effect',
    inEffect: this.inEffect(grant),
    grant,
  })));
  protected error = signal<string | null>(null);
  protected busy = signal(false);

  ngOnInit() {
    this.load();
  }

  protected reaches(grant: ProjectGrantView) {
    if (grant.kind === 'app') {
      return `GitHub App ${grant.label}`;
    }
    return grant.path ? `${grant.host}/${grant.path}` : grant.host;
  }

  protected inEffect(grant: ProjectGrantView) {
    return grant.owner_active && grant.owner_is_member;
  }

  protected stop(grant: ProjectGrantView) {
    const data: ConfirmDialogConfig = {
      title: `Stop sharing ${grant.label}?`,
      body: `Jobs of this project can no longer use ${grant.label} owned by ${grant.owner_name}.`,
      yes: 'Stop sharing',
      no: 'Cancel',
      iconClass: 'al-ico-alert',
      iconColor: 'var(--color-warning)',
      destructive: true,
    };
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(ConfirmDialogComponent, {
      data,
      panelClass: 'dialog-sm',
    }).afterClosed().subscribe(async confirmed => {
      if (!confirmed) {
        return;
      }
      this.busy.set(true);
      try {
        await lastValueFrom(this.api.post(`${HTTP.API_BASE_URL}/user_access.revoke`,
          {id: grant.id, project: this.projectId()}, {}));
        this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'The access is no longer shared with this project'));
        await this.load();
      } catch (error) {
        this.store.dispatch(addMessage(MESSAGES_SEVERITY.ERROR, error?.meta?.result_msg ?? 'The share could not be stopped.'));
      } finally {
        this.busy.set(false);
      }
    });
  }

  private async load() {
    this.error.set(null);
    try {
      const res = await lastValueFrom(this.api.post<{grants: ProjectGrantView[]}>(
        `${HTTP.API_BASE_URL}/user_access.project_grants`, {project: this.projectId()}, {}));
      this.grants.set(res.grants ?? []);
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The shared accesses could not be loaded.');
    }
  }
}
