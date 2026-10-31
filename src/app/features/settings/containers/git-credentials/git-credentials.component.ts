import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
import {DatePipe} from '@angular/common';
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
import {AddGitCredentialDialogComponent} from './add-git-credential-dialog.component';

export interface GitCredentialView {
  host: string;
  path: string;
  username: string;
  updated: string | null;
}

@Component({
  selector: 'sm-git-credentials',
  templateUrl: './git-credentials.component.html',
  styleUrls: ['./git-credentials.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TooltipDirective,
    TimeAgoPipe,
    PageHeaderComponent
  ]
})
export class GitCredentialsComponent implements OnInit {
  private apiRequest = inject(SmApiRequestsService);
  private dialog = inject(MatDialog);
  private store = inject(Store);

  protected readonly timeFormatString = TIME_FORMAT_STRING;
  protected credentials = signal<GitCredentialView[]>([]);
  protected loading = signal(true);
  protected error = signal<string | null>(null);

  ngOnInit() {
    this.load();
  }

  protected pathLabel(path: string) {
    return path || 'All repositories';
  }

  protected add() {
    this.dialog.open<AddGitCredentialDialogComponent, unknown, boolean>(AddGitCredentialDialogComponent, {
      panelClass: 'dialog-md'
    }).afterClosed().subscribe(saved => {
      if (saved) {
        this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'Git credential saved'));
        this.load();
      }
    });
  }

  protected confirmDelete(credential: GitCredentialView) {
    const scope = credential.path ? `${credential.host}/${credential.path}` : credential.host;
    const data: ConfirmDialogConfig = {
      title: 'Delete Git credential?',
      body: `Private repositories on <b>${this.escape(scope)}</b> can no longer be cloned by agents until a new credential is stored.`,
      yes: 'Delete credential',
      no: 'Cancel',
      iconClass: 'al-ico-alert',
      iconColor: 'var(--color-warning)',
      destructive: true
    };
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(ConfirmDialogComponent, {
      data,
      panelClass: 'dialog-sm'
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.delete(credential);
      }
    });
  }

  private async delete(credential: GitCredentialView) {
    try {
      await lastValueFrom(this.apiRequest.post(`${HTTP.API_BASE_URL}/git_credentials.delete`, {
        host: credential.host,
        path: credential.path
      }, {}));
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'Git credential deleted'));
      await this.load();
    } catch (error) {
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.ERROR,
        `The Git credential could not be deleted. ${error?.meta?.result_msg ?? ''}`.trim()));
    }
  }

  private async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await lastValueFrom(this.apiRequest.post<{credentials: GitCredentialView[]}>(
        `${HTTP.API_BASE_URL}/git_credentials.get_all`, {}, {}));
      this.credentials.set(res.credentials ?? []);
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The Git credentials could not be loaded.');
    } finally {
      this.loading.set(false);
    }
  }

  private escape(text: string) {
    return text.replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;'})[c]);
  }
}
