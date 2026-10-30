import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogRef} from '@angular/material/dialog';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption} from '@angular/material/core';
import {MatSelect} from '@angular/material/select';
import {MatButton} from '@angular/material/button';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';

export interface AddQueueUserDialogData {
  users: {id: string; name: string}[];
}

export interface AddQueueUserResult {
  user: string;
}

/** Pick a company user to grant access to a queue. */
@Component({
  selector: 'sm-add-queue-user-dialog',
  templateUrl: './add-queue-user-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogTemplateComponent, MatDialogActions, MatFormField, MatLabel, MatOption, MatSelect, MatButton]
})
export class AddQueueUserDialogComponent {
  protected readonly data = inject<AddQueueUserDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject<MatDialogRef<AddQueueUserDialogComponent, AddQueueUserResult>>(MatDialogRef);

  protected user = signal<string>(null);

  cancel() {
    this.dialogRef.close();
  }

  apply() {
    const user = this.user();
    if (user) {
      this.dialogRef.close({user});
    }
  }
}
