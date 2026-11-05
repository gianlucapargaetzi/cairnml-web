import {ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal} from '@angular/core';
import {PrimeTemplate} from 'primeng/api';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {EmptyStateComponent} from '@common/shared/ui-components/feedback/empty-state/empty-state.component';
import {InlineAlertComponent} from '@common/shared/ui-components/feedback/inline-alert/inline-alert.component';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {lastValueFrom} from 'rxjs';
import {toSignal} from '@angular/core/rxjs-interop';
import {MatDialog} from '@angular/material/dialog';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {HTTP} from '~/app.constants';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {Store} from '@ngrx/store';
import {addMessage} from '@common/core/actions/layout.actions';
import {MESSAGES_SEVERITY} from '@common/constants';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {ProjectSettingsStore} from '~/features/dashboard-search/project-settings-dashboard-search-permissions.store';
import {selectCurrentUserId} from '@common/core/reducers/users-reducer';
import {SHARE_LEVEL_LABELS} from '@common/shared/ui-components/inputs/share-control/share-control.component';
import {ProjectShareService} from '../project-share.service';

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
  // the project's share of this access, from its share record
  level: 'read' | 'read_write' | 'collaborator';
  share_id: string;
  // true when a run made the share (a dataset brought the credential in); such a row is read-only here
  inherited: boolean;
}

// Shown on a credential that a dataset shared with the project brought in: it is read-only here.
export const DATASET_CREDENTIAL_HINT =
  'Added by dataset. Only manual credentials, e.g. for code repositories, can be changed in project settings.';

// The accesses shared with this project. Members see who shared each one, its level and whether it is still in effect.
// The owner and collaborators of the project, the owner of an access and admins can stop a share. The secret of an
// access is never shown here.
@Component({
  selector: 'sm-project-accesses',
  templateUrl: './project-accesses.component.html',
  styleUrls: ['./project-accesses.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIcon,
    MatIconButton,
    MatSlideToggleModule,
    TooltipDirective,
    TableComponent,
    PrimeTemplate,
    EmptyStateComponent,
    ShowTooltipIfEllipsisDirective,
    InlineAlertComponent,
  ],
})
export class ProjectAccessesComponent implements OnInit {
  private api = inject(SmApiRequestsService);
  private dialog = inject(MatDialog);
  private store = inject(Store);
  private shares = inject(ProjectShareService);
  protected settingsStore = inject(ProjectSettingsStore);

  projectId = input.required<string>();

  protected grants = signal<ProjectGrantView[]>([]);
  protected readonly currentUserId = toSignal(this.store.select(selectCurrentUserId), {initialValue: null});
  protected readonly datasetHint = DATASET_CREDENTIAL_HINT;
  // whether the agents of this project may be given personal tokens shared with it (on by default)
  protected agentTokens = signal(true);

  protected readonly columns: ISmCol[] = [
    {id: 'label', header: 'Name', sortable: false},
    {id: 'reaches', header: 'Reaches', sortable: false},
    {id: 'level', header: 'Level', sortable: false},
    {id: 'owner', header: 'Shared by', sortable: false},
    {id: 'status', header: 'Status', sortable: false},
    {id: 'actions', header: '', sortable: false},
  ];
  protected readonly rows = computed(() => this.grants().map(grant => ({
    id: grant.id,
    label: grant.label,
    reaches: this.reaches(grant),
    level: SHARE_LEVEL_LABELS[grant.level] ?? grant.level,
    owner: grant.owner_name,
    status: this.inEffect(grant) ? 'In use' : 'Not in effect',
    inEffect: this.inEffect(grant),
    fromDataset: grant.inherited,
    canRevoke: !grant.inherited && (this.settingsStore.canManageMembers() || grant.owner === this.currentUserId()),
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

  // Applies at once. Only the owner of the project may change it; the warning is shown on the access, when it is shared.
  protected async setAgentTokens(allowed: boolean) {
    this.busy.set(true);
    try {
      await lastValueFrom(this.api.post(`${HTTP.API_BASE_URL}/user_access.set_agent_tokens`,
        {project: this.projectId(), allowed}, {}));
      this.agentTokens.set(allowed);
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS,
        allowed ? 'Personal tokens are allowed on this project\'s agents' : 'Personal tokens are blocked on this project\'s agents'));
    } catch (error) {
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.ERROR, error?.meta?.result_msg ?? 'The setting could not be saved.'));
    } finally {
      this.busy.set(false);
    }
  }

  protected stop(grant: ProjectGrantView) {
    const data: ConfirmDialogConfig = {
      title: `Stop sharing ${grant.label}?`,
      body: `Agents of this project can no longer use ${grant.label} owned by ${grant.owner_name}.`,
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
        await lastValueFrom(this.shares.unshare(grant.share_id));
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
      const res = await lastValueFrom(this.api.post<{grants: ProjectGrantView[]; agent_tokens_allowed: boolean}>(
        `${HTTP.API_BASE_URL}/user_access.project_grants`, {project: this.projectId()}, {}));
      this.grants.set(res.grants ?? []);
      this.agentTokens.set(res.agent_tokens_allowed !== false);
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The shared accesses could not be loaded.');
    }
  }
}
