import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {Store} from '@ngrx/store';
import {lastValueFrom} from 'rxjs';
import {HTTP} from '~/app.constants';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {addMessage} from '@common/core/actions/layout.actions';
import {MESSAGES_SEVERITY, TIME_FORMAT_STRING} from '@common/constants';
import {PageHeaderComponent} from '@common/shared/ui-components/layout/page-header/page-header.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {AddAccessDialogComponent, AddAccessKind} from './add-access-dialog.component';
import {ShareAccessDialogComponent, ShareableProject} from './share-access-dialog.component';

export interface OwnAccessView {
  id: string;
  kind: 'token' | 'app';
  label: string;
  host: string;
  path: string;
  app_id: string | null;
  api_url: string | null;
  created: string | null;
  last_checked: string | null;
  last_state: 'ok' | 'refused' | 'unreachable' | 'unverified' | null;
  last_message: string | null;
  granted_projects: string[];
}

export interface CompanyAccessView {
  host: string;
  path: string;
  username: string;
}

// The user's own repository accesses (tokens and GitHub Apps), and the company's token credentials, which are read-only
// here. The secret of an access is written once and never shown again; only its owner can check or delete it.
@Component({
  selector: 'sm-access',
  templateUrl: './access.component.html',
  styleUrls: ['./access.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule, MatProgressSpinnerModule, TooltipDirective, TimeAgoPipe, PageHeaderComponent],
})
export class AccessComponent implements OnInit {
  private apiRequest = inject(SmApiRequestsService);
  private dialog = inject(MatDialog);
  private store = inject(Store);

  protected readonly timeFormatString = TIME_FORMAT_STRING;
  protected own = signal<OwnAccessView[]>([]);
  protected company = signal<CompanyAccessView[]>([]);
  protected projects = signal<ShareableProject[]>([]);
  protected loading = signal(true);
  protected error = signal<string | null>(null);
  protected busy = signal<string | null>(null);

  ngOnInit() {
    this.load();
  }

  protected kindLabel(kind: 'token' | 'app') {
    return kind === 'app' ? 'GitHub App' : 'Token';
  }

  protected targetOf(access: OwnAccessView) {
    if (access.kind === 'app') {
      return `App ${access.app_id}`;
    }
    return access.path ? `${access.host}/${access.path}` : access.host;
  }

  protected stateLabel(state: OwnAccessView['last_state']) {
    switch (state) {
      case 'ok': return 'Works';
      case 'refused': return 'Refused';
      case 'unreachable': return 'Not reachable';
      case 'unverified': return 'Not verified';
      default: return 'Not checked yet';
    }
  }

  protected add(kind: AddAccessKind) {
    this.dialog.open<AddAccessDialogComponent, {kind: AddAccessKind}, boolean>(AddAccessDialogComponent, {
      data: {kind},
      panelClass: 'dialog-md',
    }).afterClosed().subscribe(saved => {
      if (saved) {
        this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'Access saved'));
        this.load();
      }
    });
  }

  protected projectName(id: string) {
    return this.projects().find(project => project.id === id)?.name ?? id;
  }

  protected share(access: OwnAccessView) {
    const available = this.projects().filter(project => !access.granted_projects.includes(project.id));
    this.dialog.open<ShareAccessDialogComponent, unknown, boolean>(ShareAccessDialogComponent, {
      data: {id: access.id, label: access.label, projects: available},
      panelClass: 'dialog-md',
    }).afterClosed().subscribe(shared => {
      if (shared) {
        this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'The access is shared with the project'));
        this.load();
      }
    });
  }

  protected async unshare(access: OwnAccessView, projectId: string) {
    this.busy.set(access.id);
    try {
      await lastValueFrom(this.apiRequest.post(`${HTTP.API_BASE_URL}/user_access.revoke`,
        {id: access.id, project: projectId}, {}));
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'Sharing stopped'));
      await this.load();
    } catch (error) {
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.ERROR, error?.meta?.result_msg ?? 'Sharing could not be stopped.'));
    } finally {
      this.busy.set(null);
    }
  }

  protected async check(access: OwnAccessView) {
    await this.run(access.id, 'user_access.check', 'The access was checked', 'The access could not be checked.');
  }

  protected confirmDelete(access: OwnAccessView) {
    const data: ConfirmDialogConfig = {
      title: `Delete ${access.label}?`,
      body: `The secret is removed from the server. Jobs that use it through a project will fail until another access reaches the repository.`,
      yes: 'Delete access',
      no: 'Cancel',
      iconClass: 'al-ico-alert',
      iconColor: 'var(--color-warning)',
      destructive: true,
    };
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(ConfirmDialogComponent, {
      data,
      panelClass: 'dialog-sm',
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.run(access.id, 'user_access.delete', 'Access deleted', 'The access could not be deleted.');
      }
    });
  }

  private async run(id: string, endpoint: string, success: string, failure: string) {
    this.busy.set(id);
    try {
      await lastValueFrom(this.apiRequest.post(`${HTTP.API_BASE_URL}/${endpoint}`, {id}, {}));
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, success));
      await this.load();
    } catch (error) {
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.ERROR, `${failure} ${error?.meta?.result_msg ?? ''}`.trim()));
    } finally {
      this.busy.set(null);
    }
  }

  private async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await lastValueFrom(this.apiRequest.post<{
        own: OwnAccessView[]; company: CompanyAccessView[]; projects: ShareableProject[];
      }>(`${HTTP.API_BASE_URL}/user_access.get_all`, {}, {}));
      this.own.set(res.own ?? []);
      this.company.set(res.company ?? []);
      this.projects.set(res.projects ?? []);
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The accesses could not be loaded.');
    } finally {
      this.loading.set(false);
    }
  }
}
