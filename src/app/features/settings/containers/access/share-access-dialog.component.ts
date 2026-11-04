import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogClose, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {lastValueFrom} from 'rxjs';
import {HTTP} from '~/app.constants';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {InlineAlertComponent} from '@common/shared/ui-components/feedback/inline-alert/inline-alert.component';

export interface ShareableProject {
  id: string;
  name: string;
}

export interface ShareAccessData {
  id: string;
  label: string;
  projects: ShareableProject[];
}

// Shares one of the user's accesses with a project. Members of the project can use it, and can read what it reaches,
// though not its secret. The warning is shown before the share is made.
@Component({
  selector: 'sm-share-access-dialog',
  templateUrl: './share-access-dialog.component.html',
  styleUrls: ['./share-access-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    DialogTemplateComponent,
    MatDialogClose,
    InlineAlertComponent,
  ],
})
export class ShareAccessDialogComponent {
  private fb = inject(FormBuilder);
  private api = inject(SmApiRequestsService);
  private dialogRef = inject(MatDialogRef<ShareAccessDialogComponent>);
  protected data = inject<ShareAccessData>(MAT_DIALOG_DATA);

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = this.fb.group({project: ['', Validators.required]});

  protected async share() {
    if (this.form.invalid || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      await lastValueFrom(this.api.post(`${HTTP.API_BASE_URL}/user_access.grant`,
        {id: this.data.id, project: this.form.controls.project.value}, {}));
      this.dialogRef.close(true);
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The access could not be shared.');
    } finally {
      this.saving.set(false);
    }
  }
}
