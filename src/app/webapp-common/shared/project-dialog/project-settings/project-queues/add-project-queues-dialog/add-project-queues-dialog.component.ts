import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogRef} from '@angular/material/dialog';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption} from '@angular/material/core';
import {MatSelect} from '@angular/material/select';
import {MatButton} from '@angular/material/button';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {ProjectsQueueSummary} from '~/business-logic/model/projects/projectsQueueSummary';

export interface AddProjectQueuesDialogData {
  queues: ProjectsQueueSummary[];
}

export interface AddProjectQueuesResult {
  queues: string[];
}

/** Pick one or more queues the owner may allocate to the project. */
@Component({
  selector: 'sm-add-project-queues-dialog',
  templateUrl: './add-project-queues-dialog.component.html',
  styleUrls: ['./add-project-queues-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogTemplateComponent, MatDialogActions, MatFormField, MatLabel, MatOption, MatSelect, MatButton]
})
export class AddProjectQueuesDialogComponent {
  protected readonly data = inject<AddProjectQueuesDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject<MatDialogRef<AddProjectQueuesDialogComponent, AddProjectQueuesResult>>(MatDialogRef);

  protected queues = signal<string[]>([]);

  cancel() {
    this.dialogRef.close();
  }

  apply() {
    if (this.queues().length) {
      this.dialogRef.close({queues: this.queues()});
    }
  }
}
