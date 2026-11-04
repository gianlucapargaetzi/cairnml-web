import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogClose, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {lastValueFrom} from 'rxjs';
import {HTTP} from '~/app.constants';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';

export type AddAccessKind = 'token' | 'app';

// scope 'company': the server's GitHub App, for every user; only an admin may add it

// Adds one of the user's accesses. The secret (token or App key) is sent once and is not shown again after saving.
@Component({
  selector: 'sm-add-access-dialog',
  templateUrl: './add-access-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    DialogTemplateComponent,
    MatDialogClose,
  ],
})
export class AddAccessDialogComponent {
  private fb = inject(FormBuilder);
  private api = inject(SmApiRequestsService);
  private dialogRef = inject(MatDialogRef<AddAccessDialogComponent>);
  protected data = inject<{kind: AddAccessKind; scope?: 'user' | 'company'}>(MAT_DIALOG_DATA);
  protected readonly companyScope = this.data.scope === 'company';

  protected readonly isApp = this.data.kind === 'app';
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected keyFileName = signal<string | null>(null);

  protected readonly form = this.fb.group({
    label: ['', [Validators.required, Validators.maxLength(80)]],
    host: ['github.com'],
    path: [''],
    token: [''],
    app_id: [''],
    api_url: [''],
    key: [''],
  });

  constructor() {
    if (this.isApp) {
      this.form.controls.app_id.setValidators([Validators.required, Validators.pattern(/^\d{1,12}$/)]);
      this.form.controls.key.setValidators([Validators.required]);
    } else {
      this.form.controls.token.setValidators([Validators.required]);
    }
  }

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
    const endpoint = this.isApp ? 'user_access.add_app' : 'user_access.add_token';
    const body = this.isApp
      ? {label: value.label, app_id: value.app_id, api_url: value.api_url, key: value.key, scope: this.data.scope ?? 'user'}
      : {label: value.label, host: value.host, path: value.path, token: value.token};
    try {
      await lastValueFrom(this.api.post(`${HTTP.API_BASE_URL}/${endpoint}`, body, {}));
      this.dialogRef.close(true);
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The access could not be saved.');
    } finally {
      this.saving.set(false);
    }
  }
}
