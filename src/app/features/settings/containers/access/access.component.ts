import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {Store} from '@ngrx/store';
import {lastValueFrom} from 'rxjs';
import {PrimeTemplate} from 'primeng/api';
import {HTTP} from '~/app.constants';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {addMessage} from '@common/core/actions/layout.actions';
import {MESSAGES_SEVERITY} from '@common/constants';
import {PageHeaderComponent} from '@common/shared/ui-components/layout/page-header/page-header.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {EmptyStateComponent} from '@common/shared/ui-components/feedback/empty-state/empty-state.component';
import {InlineAlertComponent} from '@common/shared/ui-components/feedback/inline-alert/inline-alert.component';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {selectIsAdmin} from '@common/core/reducers/users-reducer';
import {AddAccessDialogComponent} from './add-access-dialog.component';
import {serverMessage} from '@common/shared/utils/server-message';

// One credential, as the server lists it: a GitHub App (a user's or the company's), or a company Git
// credential for another host. "git" rows are the company's Git credentials; the others are accesses.
export interface CredentialView {
  id: string;
  source: 'access' | 'git';
  type: string;
  name: string;
  owner: string;
  scope: 'user' | 'company';
  valid_for: string;
  state: 'ok' | 'refused' | 'unreachable' | 'unverified' | 'unchecked';
  message: string;
  last_checked: string | null;
  can_edit: boolean;
  app_id: string | null;
  host?: string;
  path?: string;
}

// The credentials of the user, in one table like the devices: the owner, what each is valid for, whether it is valid,
// and what this user may do with it. Only the owner changes an own credential; an admin changes the company's.
@Component({
  selector: 'sm-access',
  templateUrl: './access.component.html',
  styleUrls: ['./access.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TooltipDirective,
    ShowTooltipIfEllipsisDirective,
    TimeAgoPipe,
    PageHeaderComponent,
    TableComponent,
    PrimeTemplate,
    EmptyStateComponent,
    InlineAlertComponent,
  ],
})
export class AccessComponent implements OnInit {
  private apiRequest = inject(SmApiRequestsService);
  private dialog = inject(MatDialog);
  private store = inject(Store);

  protected credentials = signal<CredentialView[]>([]);
  protected loading = signal(true);
  protected error = signal<string | null>(null);
  protected busy = signal<string | null>(null);

  protected isAdmin = this.store.selectSignal(selectIsAdmin);

  protected readonly columns: ISmCol[] = [
    {id: 'name', collapseOrder: 9, header: 'Name', sortable: false},
    {id: 'type', collapseOrder: 3, header: 'Type', sortable: false},
    {id: 'owner', collapseOrder: 2, header: 'Owner', sortable: false},
    {id: 'valid_for', collapseOrder: 1, header: 'Valid for', sortable: false},
    {id: 'status', collapseOrder: 6, header: 'Status', sortable: false},
    {id: 'actions', header: '', sortable: false, fixedWidth: true},
  ];

  protected readonly rows = computed(() => this.credentials().map(credential => ({
    id: credential.id,
    name: credential.name,
    type: credential.type,
    owner: credential.owner,
    valid_for: credential.valid_for,
    status: this.stateLabel(credential.state),
    state: credential.state,
    credential,
  })));

  ngOnInit() {
    this.load();
  }


  protected stateLabel(state: CredentialView['state']) {
    switch (state) {
      case 'ok': return 'Valid';
      case 'refused': return 'Refused';
      case 'unreachable': return 'Not reachable';
      case 'unverified': return 'Not verified';
      default: return 'Not checked yet';
    }
  }

  protected isInvalid(state: CredentialView['state']) {
    return state === 'refused' || state === 'unreachable';
  }


  protected add() {
    this.dialog.open<AddAccessDialogComponent, {isAdmin: boolean}, boolean>(AddAccessDialogComponent, {
      data: {isAdmin: this.isAdmin()},
      panelClass: 'dialog-md',
    }).afterClosed().subscribe(saved => {
      if (saved) {
        this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'Credential saved'));
        this.load();
      }
    });
  }



  protected async check(credential: CredentialView) {
    await this.run(credential.id, 'user_access.check', {id: credential.id}, 'The credential was checked',
      'The credential could not be checked.');
  }

  protected confirmDelete(credential: CredentialView) {
    const data: ConfirmDialogConfig = {
      title: `Delete ${credential.name}?`,
      body: 'The secret is removed from the server. Jobs that use it will no longer reach the repositories it reached.',
      yes: 'Delete',
      no: 'Cancel',
      iconClass: 'al-ico-alert',
      iconColor: 'var(--color-warning)',
      destructive: true,
    };
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(ConfirmDialogComponent, {
      data,
      panelClass: 'dialog-sm',
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) {
        return;
      }
      if (credential.source === 'git') {
        this.run(credential.id, 'git_credentials.delete', {host: credential.host, path: credential.path},
          'Credential deleted', 'The credential could not be deleted.');
      } else {
        this.run(credential.id, 'user_access.delete', {id: credential.id}, 'Credential deleted',
          'The credential could not be deleted.');
      }
    });
  }

  private async run(id: string, endpoint: string, body: unknown, success: string, failure: string) {
    this.busy.set(id);
    try {
      await lastValueFrom(this.apiRequest.post(`${HTTP.API_BASE_URL}/${endpoint}`, body, {}));
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, success));
      await this.load();
    } catch (error) {
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.ERROR, `${failure} ${serverMessage(error) ?? ''}`.trim()));
    } finally {
      this.busy.set(null);
    }
  }

  private async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await lastValueFrom(this.apiRequest.post<{
        credentials: CredentialView[];
      }>(`${HTTP.API_BASE_URL}/user_access.get_all`, {}, {}));
      this.credentials.set(res.credentials ?? []);
    } catch (error) {
      this.error.set(serverMessage(error) ?? 'The credentials could not be loaded.');
    } finally {
      this.loading.set(false);
    }
  }
}
