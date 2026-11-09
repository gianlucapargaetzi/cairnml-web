import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption} from '@angular/material/core';
import {MatSelect} from '@angular/material/select';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';

// A credential the user may add to the project: its id, its name, where it reaches and who owns it.
export interface AddableCredential {
  id: string;
  name: string;
  host: string;
  path: string;
  owner: string;
}

export interface AddProjectCredentialsDialogData {
  credentials: AddableCredential[];
}

export interface AddProjectCredentialsResult {
  ids: string[];
}

@Component({
  selector: 'sm-add-project-credentials-dialog',
  templateUrl: './add-project-credentials-dialog.component.html',
  styleUrls: ['./add-project-credentials-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogTemplateComponent, MatButton, MatFormField, MatLabel, MatSelect, MatOption],
})
export class AddProjectCredentialsDialogComponent {
  protected data = inject<AddProjectCredentialsDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject<MatDialogRef<AddProjectCredentialsDialogComponent, AddProjectCredentialsResult>>(MatDialogRef);

  protected readonly ids = signal<string[]>([]);

  protected cancel() {
    this.dialogRef.close();
  }

  protected apply() {
    this.dialogRef.close({ids: this.ids()});
  }
}
