import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogClose, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatError, MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {lastValueFrom} from 'rxjs';
import {HTTP} from '~/app.constants';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {serverMessage} from '@common/shared/utils/server-message';

export interface AddCredentialData {
  isAdmin: boolean;
}

// Adds one GitHub App, for the user or, for an admin, for the whole company. The key is sent once and never shown again.
@Component({
  selector: 'sm-add-access-dialog',
  templateUrl: './add-access-dialog.component.html',
  styleUrls: ['./add-access-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatError,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    DialogTemplateComponent,
    MatDialogClose,
  ],
})
export class AddAccessDialogComponent {
  private fb = inject(FormBuilder);
  private api = inject(SmApiRequestsService);
  private dialogRef = inject(MatDialogRef<AddAccessDialogComponent>);
  protected data = inject<AddCredentialData>(MAT_DIALOG_DATA);

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected keyFileName = signal<string | null>(null);

  protected readonly form = this.fb.group({
    scope: ['user', Validators.required],
    label: ['', [Validators.required, Validators.maxLength(80)]],
    app_id: ['', [Validators.required, Validators.pattern(/^\d{1,12}$/)]],
    api_url: [''],
    key: ['', Validators.required],
  });

  // The key file is read in the browser and sent with the request; the text is not shown.
  protected async keyFileChosen(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    this.form.controls.key.setValue(await file.text());
    this.keyFileName.set(file.name);
  }

  protected async save() {
    if (this.form.invalid || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const value = this.form.getRawValue();
    try {
      await lastValueFrom(this.api.post(`${HTTP.API_BASE_URL}/user_access.add_app`, {
          label: value.label, app_id: value.app_id, api_url: value.api_url, key: value.key, scope: value.scope,
        }, {}));
      this.dialogRef.close(true);
    } catch (error) {
      this.error.set(serverMessage(error) ?? 'The credential could not be saved.');
    } finally {
      this.saving.set(false);
    }
  }
}
