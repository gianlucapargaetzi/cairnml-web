import {ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked} from '@angular/core';
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
export class ProjectAccessesComponent {
  private api = inject(SmApiRequestsService);
  private dialog = inject(MatDialog);
  private shares = inject(ProjectShareService);
  protected settingsStore = inject(ProjectSettingsStore);

  projectId = input.required<string>();

  protected readonly usable = signal<ProjectUsableCredential[]>([]);
  // credentials picked in the add dialog, not saved yet
  protected readonly pendingAdd = signal<AddableCredential[]>([]);
  // share ids of usable credentials to remove on Save
  protected readonly pendingRemove = signal<string[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly dirty = computed(() => this.pendingAdd().length > 0 || this.pendingRemove().length > 0);
  protected readonly datasetHint = DATASET_CREDENTIAL_HINT;

  protected readonly rows = computed<CredentialRow[]>(() => {
    const removed = new Set(this.pendingRemove());
    const kept: CredentialRow[] = this.usable()
      .filter(credential => !removed.has(credential.share_id))
      .map(credential => ({
        key: credential.id,
        name: credential.name,
        reaches: this.reaches(credential.host, credential.path),
        scope: credential.scope,
        level: SHARE_LEVEL_LABELS[credential.level] ?? credential.level,
        owner: this.ownerName(credential.owner, credential.owner_name),
        inherited: credential.inherited,
        removable: credential.removable && !!credential.share_id,
        usable: credential,
      }));
    const added: CredentialRow[] = this.pendingAdd().map(credential => ({
      key: credential.id,
      name: credential.name,
      reaches: this.reaches(credential.host, credential.path),
      scope: 'project',
      level: SHARE_LEVEL_LABELS.read,
      owner: this.ownerName(credential.owner, null),
      inherited: false,
      removable: true,
    }));
    return [...kept, ...added];
  });

  constructor() {
    // The rights come with the members of the project, which load after the section is created.
    effect(() => {
      if (this.settingsStore.canManageMembers()) {
        untracked(() => this.load());
      }
    });
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
      this.usable.set(res.credentials);
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The credentials of the project could not be loaded.');
    }
  }

  // The credentials the user may add: their own, and visible ones, that the project does not use yet.
  protected async addCredentials() {
    this.error.set(null);
    try {
      const res = await lastValueFrom(this.api.post<{credentials: AddableCredential[]}>(
        `${HTTP.API_BASE_URL}/user_access.get_all`, {}, {}));
      const current = new Set(this.rows().map(row => row.key));
      const available = (res.credentials ?? []).filter(credential => !current.has(credential.id));
      this.dialog.open<AddProjectCredentialsDialogComponent, AddProjectCredentialsDialogData, AddProjectCredentialsResult>(
        AddProjectCredentialsDialogComponent, {data: {credentials: available}, panelClass: 'dialog-sm'},
      ).afterClosed().subscribe(result => {
        if (result?.ids?.length) {
          const picked = available.filter(credential => result.ids.includes(credential.id));
          this.pendingAdd.update(items => [...items, ...picked.filter(c => !items.some(item => item.id === c.id))]);
        }
      });
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The credentials could not be loaded.');
    }
  }

  // A saved share is removed on Save after a confirmation; a credential added here and not saved yet is only dropped.
  protected removeRow(row: CredentialRow) {
    if (!row.usable) {
      this.pendingAdd.update(items => items.filter(item => item.id !== row.key));
      return;
    }
    const shareId = row.usable.share_id;
    this.error.set(null);
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(ConfirmDialogComponent, {
      data: {
        title: `Remove ${row.name}?`,
        body: `The project loses ${row.name} when you save. Agents of the project can no longer use it. The credential itself is not changed.`,
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
      for (const credential of this.pendingAdd()) {
        await lastValueFrom(this.shares.shareCredential(credential.id, this.projectId()));
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
