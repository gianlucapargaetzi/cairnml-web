import {ProjectsUpdateMemberRoleRequest} from '~/business-logic/model/projects/projectsUpdateMemberRoleRequest';
import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption} from '@angular/material/core';
import {MatSelect} from '@angular/material/select';
import {MatButton} from '@angular/material/button';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {CompanyUser} from '@common/shared/project-dialog/project-settings/project-settings-dialog.store';

export interface AddProjectMemberDialogConfig {
  users: CompanyUser[];
}

export interface AddProjectMemberResult {
  user: string;
  role: ProjectsUpdateMemberRoleRequest.RoleEnum;
}

@Component({
  selector: 'sm-add-project-member-dialog',
  templateUrl: './add-project-member-dialog.component.html',
  styleUrls: ['./add-project-member-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogTemplateComponent, MatFormField, MatLabel, MatOption, MatSelect, MatButton]
})
export class AddProjectMemberDialogComponent {
  protected readonly data = inject<AddProjectMemberDialogConfig>(MAT_DIALOG_DATA);
  private dialogRef = inject<MatDialogRef<AddProjectMemberDialogComponent, AddProjectMemberResult>>(MatDialogRef);

  protected readonly roles: {value: ProjectsUpdateMemberRoleRequest.RoleEnum; label: string}[] = [
    {value: 'read', label: 'Read'},
    {value: 'read_write', label: 'Read & Write'},
    {value: 'collaborator', label: 'Collaborator'},
  ];
  protected user = signal<string>(null);
  protected role = signal<ProjectsUpdateMemberRoleRequest.RoleEnum>('read');

  cancel() {
    this.dialogRef.close();
  }

  apply() {
    const user = this.user();
    if (user) {
      this.dialogRef.close({user, role: this.role()});
    }
  }
}
