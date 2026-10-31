import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogRef} from '@angular/material/dialog';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption} from '@angular/material/core';
import {MatSelect} from '@angular/material/select';
import {MatButton} from '@angular/material/button';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';

export interface ReassignDeviceDialogConfig {
  deviceName: string;
  users: {id: string; name: string}[];
}

@Component({
  selector: 'sm-reassign-device-dialog',
  templateUrl: './reassign-device-dialog.component.html',
  styleUrls: ['./reassign-device-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogTemplateComponent, MatDialogActions, MatFormField, MatLabel, MatOption, MatSelect, MatButton]
})
export class ReassignDeviceDialogComponent {
  protected readonly data = inject<ReassignDeviceDialogConfig>(MAT_DIALOG_DATA);
  private dialogRef = inject<MatDialogRef<ReassignDeviceDialogComponent, string>>(MatDialogRef);

  protected user = signal<string>(null);

  cancel() {
    this.dialogRef.close();
  }

  apply() {
    const user = this.user();
    if (user) {
      this.dialogRef.close(user);
    }
  }
}
