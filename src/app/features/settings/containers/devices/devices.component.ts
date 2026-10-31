import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {DatePipe} from '@angular/common';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {Store} from '@ngrx/store';
import {selectCurrentUser} from '@common/core/reducers/users-reducer';
import {lastValueFrom} from 'rxjs';
import {HTTP} from '~/app.constants';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {ApiUsersService} from '~/business-logic/api-services/users.service';
import {addMessage} from '@common/core/actions/layout.actions';
import {MESSAGES_SEVERITY, TIME_FORMAT_STRING} from '@common/constants';
import {PageHeaderComponent} from '@common/shared/ui-components/layout/page-header/page-header.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {PrimeTemplate} from 'primeng/api';
import {ReassignDeviceDialogComponent, ReassignDeviceDialogConfig} from './reassign-device-dialog.component';

export interface DeviceView {
  id: string;
  user: string;
  owner_name: string | null;
  owner_disabled: boolean;
  kind: 'client' | 'agent';
  name: string;
  created: string | null;
  last_used: string | null;
  revoked: boolean;
}

const ADMIN_ROLES = ['admin', 'root'];

const KIND_LABELS: Record<string, string> = {
  client: 'Client',
  agent: 'Agent'
};

@Component({
  selector: 'sm-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatIconModule,
    MatButtonModule,
    TooltipDirective,
    TimeAgoPipe,
    PageHeaderComponent,
    TableComponent,
    PrimeTemplate
  ]
})
export class DevicesComponent implements OnInit {
  private apiRequest = inject(SmApiRequestsService);
  private usersApi = inject(ApiUsersService);
  private dialog = inject(MatDialog);
  private store = inject(Store);

  protected readonly timeFormatString = TIME_FORMAT_STRING;
  protected devices = signal<DeviceView[]>([]);
  private currentUser = this.store.selectSignal(selectCurrentUser);
  protected isAdmin = computed(() => ADMIN_ROLES.includes(this.currentUser()?.role));
  protected loading = signal(true);
  protected error = signal<string | null>(null);
  protected readonly columns: ISmCol[] = [
    {id: 'name', header: 'Name', style: {minWidth: '200px'}},
    {id: 'kind', header: 'Kind', style: {width: '120px'}},
    {id: 'owner', header: 'Owner', style: {width: '180px'}},
    {id: 'created', header: 'Created', style: {width: '140px'}},
    {id: 'last_used', header: 'Last used', style: {width: '140px'}},
    {id: 'status', header: 'Status', style: {width: '120px'}},
    {id: 'actions', header: '', style: {width: '104px'}},
  ];

  ngOnInit() {
    this.load();
  }

  protected kindLabel(kind: string) {
    return KIND_LABELS[kind] ?? kind;
  }

  protected ownerLabel(device: DeviceView) {
    return device.owner_name || device.user;
  }

  protected statusLabel(device: DeviceView) {
    if (device.revoked) {
      return 'Revoked';
    }
    return device.owner_disabled ? 'Owner disabled' : 'Active';
  }

  protected async reassign(device: DeviceView) {
    let res;
    try {
      res = await lastValueFrom(this.usersApi.usersGetAllEx({only_fields: ['id', 'name']}));
    } catch (error) {
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.ERROR,
        `The users could not be loaded. ${error?.meta?.result_msg ?? ''}`.trim()));
      return;
    }
    const users = (res.users ?? []).filter(u => u.id !== device.user).map(u => ({id: u.id, name: u.name}));
    const data: ReassignDeviceDialogConfig = {deviceName: device.name || device.id, users};
    this.dialog.open<ReassignDeviceDialogComponent, ReassignDeviceDialogConfig, string>(ReassignDeviceDialogComponent, {
      data,
      panelClass: 'dialog-md'
    }).afterClosed().subscribe(userId => {
      if (userId) {
        this.moveDevice(device, userId);
      }
    });
  }

  private async moveDevice(device: DeviceView, userId: string) {
    try {
      await lastValueFrom(this.apiRequest.post(`${HTTP.API_BASE_URL}/devices.reassign`, {id: device.id, user: userId}, {}));
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'Device reassigned'));
      await this.load();
    } catch (error) {
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.ERROR,
        `The device could not be reassigned. ${error?.meta?.result_msg ?? ''}`.trim()));
    }
  }

  protected confirmRevoke(device: DeviceView) {
    const data: ConfirmDialogConfig = {
      title: 'Revoke device?',
      body: `<b>${this.escape(device.name || device.id)}</b> can no longer get access tokens. Its next request is refused.`,
      yes: 'Revoke device',
      no: 'Cancel',
      iconClass: 'al-ico-alert',
      iconColor: 'var(--color-warning)',
      destructive: true
    };
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(ConfirmDialogComponent, {
      data,
      panelClass: 'dialog-md'
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.revoke(device);
      }
    });
  }

  private async revoke(device: DeviceView) {
    try {
      await lastValueFrom(this.apiRequest.post(`${HTTP.API_BASE_URL}/devices.revoke`, {id: device.id}, {}));
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'Device revoked'));
      await this.load();
    } catch (error) {
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.ERROR,
        `The device could not be revoked. ${error?.meta?.result_msg ?? ''}`.trim()));
    }
  }

  protected retry() {
    this.load();
  }

  private async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await lastValueFrom(this.apiRequest.post<{devices: DeviceView[]}>(`${HTTP.API_BASE_URL}/devices.get_all`, {}, {}));
      this.devices.set([...(res.devices ?? [])].sort((a, b) => (b.created ?? '').localeCompare(a.created ?? '')));
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The devices could not be loaded.');
    } finally {
      this.loading.set(false);
    }
  }

  private escape(text: string) {
    return text.replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;'})[c]);
  }
}
