import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {DatePipe} from '@angular/common';
import {MatDialog} from '@angular/material/dialog';
import {MatFormField} from '@angular/material/form-field';
import {MatSelect} from '@angular/material/select';
import {MatOption} from '@angular/material/core';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton, MatButton} from '@angular/material/button';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {ProjectMember} from '~/business-logic/model/projects/projectMember';
import {ProjectSettingsStore} from '~/features/dashboard-search/project-settings-dashboard-search-permissions.store';
import {CompanyUser, MemberRow} from '@common/shared/project-dialog/project-settings/project-settings-dialog.store';
import {
  AddProjectMemberDialogComponent,
  AddProjectMemberResult
} from '../add-project-member-dialog/add-project-member-dialog.component';

/** The users of a project: who is a member, with which role, and adding, changing and removing them. */
@Component({
  selector: 'sm-project-members',
  templateUrl: './project-members.component.html',
  styleUrls: ['./project-members.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButton, MatFormField, MatSelect, MatOption, MatIcon, MatIconButton, DatePipe, TooltipDirective]
})
export class ProjectMembersComponent {
  protected settingsStore = inject(ProjectSettingsStore);
  private dialog = inject(MatDialog);

  protected readonly roles: {value: ProjectMember.RoleEnum; label: string}[] = [
    {value: ProjectMember.RoleEnum.Read, label: 'Read'},
    {value: ProjectMember.RoleEnum.ReadWrite, label: 'Read & Write'},
    {value: ProjectMember.RoleEnum.Collaborator, label: 'Collaborator'},
  ];
  protected memberError = signal<string>(null);
  protected memberBusy = signal(false);

  roleLabel(role: ProjectMember.RoleEnum | 'owner'): string {
    return role === 'owner' ? 'Owner' : this.roles.find(item => item.value === role)?.label ?? role;
  }

  startAddMember() {
    this.memberError.set(null);
    this.dialog.open<AddProjectMemberDialogComponent, {users: CompanyUser[]}, AddProjectMemberResult>(AddProjectMemberDialogComponent, {
      data: {users: this.settingsStore.availableUsers()},
      panelClass: 'dialog-sm',
    }).afterClosed().subscribe(async result => {
      if (result) {
        await this.runMemberAction(() => this.settingsStore.addMember(result.user, result.role));
      }
    });
  }

  async changeMemberRole(row: MemberRow, role: ProjectMember.RoleEnum) {
    if (role === row.role) {
      return;
    }
    await this.runMemberAction(() => this.settingsStore.updateMemberRole(row.user, role));
  }

  removeMember(row: MemberRow) {
    this.memberError.set(null);
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(ConfirmDialogComponent, {
      data: {
        title: `Remove ${row.name}?`,
        body: `${row.name} loses access to this project. Their tasks and models stay in the project.`,
        yes: 'Remove',
        no: 'Cancel',
        iconClass: 'al-ico-dialog-x',
        destructive: true,
      },
      panelClass: 'dialog-sm',
    }).afterClosed().subscribe(async confirmed => {
      if (confirmed) {
        await this.runMemberAction(() => this.settingsStore.removeMember(row.user));
      }
    });
  }

  private async runMemberAction(action: () => Promise<void>) {
    this.memberBusy.set(true);
    this.memberError.set(null);
    try {
      await action();
    } catch (error) {
      this.memberError.set(error?.meta?.result_msg ?? error?.message ?? 'The change could not be saved.');
    } finally {
      this.memberBusy.set(false);
    }
  }
}
