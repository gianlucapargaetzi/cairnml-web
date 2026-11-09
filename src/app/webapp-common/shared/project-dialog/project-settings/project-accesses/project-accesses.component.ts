import {ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal} from '@angular/core';
import {lastValueFrom} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {HTTP} from '~/app.constants';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {SHARE_LEVEL_LABELS} from '@common/shared/ui-components/inputs/share-control/share-control.component';
import {ProjectSettingsStore} from '~/features/dashboard-search/project-settings-dashboard-search-permissions.store';
import {ProjectShareService, ProjectUsableCredential} from '../project-share.service';
import {
  AddableCredential,
  AddProjectCredentialsDialogComponent,
  AddProjectCredentialsDialogData,
  AddProjectCredentialsResult
} from './add-project-credentials-dialog/add-project-credentials-dialog.component';

// Shown on a credential that a dataset shared with the project brought in: it is read-only here.
export const DATASET_CREDENTIAL_HINT =
  'Added by dataset. Only manual credentials, e.g. for code repositories, can be changed in project settings.';

// A credential as user_access.get_all lists it, with what the add list needs to choose it.
interface CredentialListRow extends AddableCredential {
  source: 'access' | 'git';
  scope: 'user' | 'company';
  owner: string;
}

// A row of the table: a credential already usable by the project, or one added here and not saved yet.
interface CredentialRow {
  key: string;
  name: string;
  reaches: string;
  scope: 'public' | 'project';
  level: string;
  owner: string;
  inherited: boolean;
  removable: boolean;
  usable?: ProjectUsableCredential;
}

// The credentials a project can use. The owner and collaborators of the project add a credential and remove a share they
// may remove; the changes are applied with Save. Members do not see the section. The secret of a credential is never shown.
@Component({
  selector: 'sm-project-accesses',
  templateUrl: './project-accesses.component.html',
  styleUrls: ['./project-accesses.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButton, MatIcon, MatIconButton, TooltipDirective],
})
export class ProjectAccessesComponent implements OnInit {
  private api = inject(SmApiRequestsService);
  private dialog = inject(MatDialog);
  private shares = inject(ProjectShareService);
  protected settingsStore = inject(ProjectSettingsStore);

  projectId = input.required<string>();

  protected readonly usable = signal<ProjectUsableCredential[]>([]);
  // from projects.usable: the server decides who may add and remove the shares of the project
  protected readonly canManage = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly datasetHint = DATASET_CREDENTIAL_HINT;

  protected readonly rows = computed<CredentialRow[]>(() => this.usable().map(credential => ({
    key: credential.id,
    name: credential.name,
    reaches: this.reaches(credential.host, credential.path),
    scope: credential.scope,
    level: SHARE_LEVEL_LABELS[credential.level] ?? credential.level,
    owner: this.ownerName(credential.owner, credential.owner_name),
    inherited: credential.inherited,
    removable: credential.removable,
    usable: credential,
  })));

  ngOnInit() {
    this.load();
  }

  protected scopeLabel(scope: 'public' | 'project'): string {
    return scope === 'public' ? 'Public' : 'Project';
  }

  protected reaches(host: string, path: string): string {
    return path ? `${host}/${path}` : host;
  }

  protected ownerName(id: string | null, name: string | null): string {
    return name ?? (id ? this.settingsStore.companyUsers().find(user => user.id === id)?.name ?? id : '');
  }

  protected async load() {
    this.error.set(null);
    try {
      const res = await lastValueFrom(this.shares.usable(this.projectId()));
      this.canManage.set(res.can_manage);
      this.usable.set(res.credentials);
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The credentials of the project could not be loaded.');
    }
  }

  // The credentials the user may add: their own, and visible ones, that the project does not use yet.
  protected async addCredentials() {
    this.error.set(null);
    try {
      const res = await lastValueFrom(this.api.post<{credentials: CredentialListRow[]}>(
        `${HTTP.API_BASE_URL}/user_access.get_all`, {}, {}));
      const current = new Set(this.rows().map(row => row.key));
      // Only the user's own credentials (the list holds no one else's with scope user) that are not a company Git
      // credential: the caller must be able to share them.
      const available = (res.credentials ?? []).filter(credential => credential.source === 'access'
        && credential.scope === 'user' && !current.has(credential.id));
      this.dialog.open<AddProjectCredentialsDialogComponent, AddProjectCredentialsDialogData, AddProjectCredentialsResult>(
        AddProjectCredentialsDialogComponent, {data: {credentials: available}, panelClass: 'dialog-sm'},
      ).afterClosed().subscribe(async result => {
        if (result?.ids?.length) {
          await this.run(async () => {
            for (const id of result.ids) {
              await lastValueFrom(this.shares.shareCredential(id, this.projectId()));
            }
          });
        }
      });
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The credentials could not be loaded.');
    }
  }

  // A share is removed after a confirmation.
  protected removeRow(row: CredentialRow) {
    const shareId = row.usable.share_id;
    if (!shareId) {
      return;
    }
    this.error.set(null);
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(ConfirmDialogComponent, {
      data: {
        title: `Remove ${row.name}?`,
        body: `The project loses ${row.name}. Agents of the project can no longer use it. The credential itself is not changed.`,
        yes: 'Remove',
        no: 'Cancel',
        iconClass: 'al-ico-dialog-x',
        destructive: true,
      },
      panelClass: 'dialog-sm',
    }).afterClosed().subscribe(async confirmed => {
      if (confirmed) {
        await this.run(() => lastValueFrom(this.shares.unshare(shareId)));
      }
    });
  }

  // Applies a change at once and reloads: there is no Save step.
  private async run(action: () => Promise<unknown>) {
    this.busy.set(true);
    this.error.set(null);
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
