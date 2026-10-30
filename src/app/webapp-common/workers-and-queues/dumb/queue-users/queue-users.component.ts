import {ChangeDetectionStrategy, Component, inject, input, OnInit, signal} from '@angular/core';
import {DatePipe} from '@angular/common';
import {lastValueFrom} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {ApiQueuesService} from '~/business-logic/api-services/queues.service';
import {ApiUsersService} from '~/business-logic/api-services/users.service';
import {QueuesQueueUser} from '~/business-logic/model/queues/queuesQueueUser';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {
  AddQueueUserDialogComponent,
  AddQueueUserDialogData,
  AddQueueUserResult
} from './add-queue-user-dialog/add-queue-user-dialog.component';

/** The users granted access to a queue, with adding and removing them (admins only; the server refuses others). */
@Component({
  selector: 'sm-queue-users',
  templateUrl: './queue-users.component.html',
  styleUrls: ['./queue-users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButton, MatIcon, MatIconButton, DatePipe, TooltipDirective]
})
export class QueueUsersComponent implements OnInit {
  private queuesApi = inject(ApiQueuesService);
  private usersApi = inject(ApiUsersService);
  private dialog = inject(MatDialog);

  queueId = input.required<string>();

  protected users = signal<QueuesQueueUser[]>([]);
  private names = signal<Map<string, string>>(new Map());
  protected error = signal<string>(null);
  protected busy = signal(false);

  ngOnInit() {
    this.load();
  }

  protected nameOf(user: string): string {
    return this.names().get(user) ?? user;
  }

  protected async load() {
    try {
      const res = await lastValueFrom(this.queuesApi.queuesGetUsers({queue: this.queueId()}));
      this.users.set(res.users ?? []);
      const company = await lastValueFrom(this.usersApi.usersGetAllEx({only_fields: ['id', 'name']}));
      this.names.set(new Map((company.users ?? []).map(u => [u.id, u.name])));
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The users of the queue could not be loaded.');
    }
  }

  protected addUser() {
    this.error.set(null);
    this.usersApi.usersGetAllEx({only_fields: ['id', 'name']}).subscribe(res => {
      const granted = new Set(this.users().map(u => u.user));
      const available = (res.users ?? []).filter(u => !granted.has(u.id));
      this.dialog.open<AddQueueUserDialogComponent, AddQueueUserDialogData, AddQueueUserResult>(AddQueueUserDialogComponent, {
        data: {users: available},
        panelClass: 'dialog-sm',
      }).afterClosed().subscribe(async result => {
        if (result) {
          await this.run(() => lastValueFrom(this.queuesApi.queuesAddUser({queue: this.queueId(), user: result.user})));
        }
      });
    });
  }

  protected removeUser(row: QueuesQueueUser) {
    this.error.set(null);
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(ConfirmDialogComponent, {
      data: {
        title: `Remove ${row.user}?`,
        body: `${row.user} can no longer use this queue. Their allocations of it on their projects are removed too.`,
        yes: 'Remove',
        no: 'Cancel',
        iconClass: 'al-ico-dialog-x',
        destructive: true,
      },
      panelClass: 'dialog-sm',
    }).afterClosed().subscribe(async confirmed => {
      if (confirmed) {
        await this.run(() => lastValueFrom(this.queuesApi.queuesRemoveUser({queue: this.queueId(), user: row.user})));
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
