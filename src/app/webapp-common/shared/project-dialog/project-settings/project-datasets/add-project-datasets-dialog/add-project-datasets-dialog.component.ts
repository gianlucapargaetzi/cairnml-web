import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogRef} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption} from '@angular/material/core';
import {MatSelect} from '@angular/material/select';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {AccessDataset} from '@common/datasets/dataset-git/dataset-access.service';

export interface AddProjectDatasetsDialogData {
  datasets: AccessDataset[];
}

export interface AddProjectDatasetsResult {
  ids: string[];
}

@Component({
  selector: 'sm-add-project-datasets-dialog',
  templateUrl: './add-project-datasets-dialog.component.html',
  styleUrls: ['./add-project-datasets-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogTemplateComponent, MatDialogActions, MatButton, MatFormField, MatLabel, MatSelect, MatOption],
})
export class AddProjectDatasetsDialogComponent {
  protected data = inject<AddProjectDatasetsDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject<MatDialogRef<AddProjectDatasetsDialogComponent, AddProjectDatasetsResult>>(MatDialogRef);

  protected readonly ids = signal<string[]>([]);

  protected cancel() {
    this.dialogRef.close();
  }

  protected apply() {
    this.dialogRef.close({ids: this.ids()});
  }
}
