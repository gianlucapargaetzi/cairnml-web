import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, ValidatorFn, Validators} from '@angular/forms';
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

export interface AddCredentialData {
  isAdmin: boolean;
}

// Adds one credential: a token or a GitHub App, for the user or, for an admin, for the whole company. A company token
// is a Git credential for a host, as the company credentials are stored. The secret is sent once and never shown again.
@Component({
  selector: 'sm-add-access-dialog',
  templateUrl: './add-access-dialog.component.html',
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
    kind: ['token', Validators.required],
    scope: ['user', Validators.required],
    label: ['', [Validators.required, Validators.maxLength(80)]],
    host: ['github.com', Validators.required],
    path: [''],
    username: [''],
    token: [''],
    app_id: [''],
    api_url: [''],
    key: [''],
  });

  constructor() {
    this.applyRules();
    this.form.valueChanges.subscribe(() => this.applyRules());
  }

  protected get isApp() {
    return this.form.controls.kind.value === 'app';
  }

  protected get companyScope() {
    return this.form.controls.scope.value === 'company';
  }

  // Which fields are needed depends on the kind and the scope
  private applyRules() {
    const need = (name: string, validators: ValidatorFn[]) => {
      const control = this.form.get(name);
      control?.setValidators(validators);
      control?.updateValueAndValidity({emitEvent: false});
    };
    const app = this.isApp;
    const company = this.companyScope;
    need('label', [Validators.required, Validators.maxLength(80)]);
    need('host', app ? [] : [Validators.required]);
    need('username', !app && company ? [Validators.required] : []);
    need('token', !app ? [Validators.required] : []);
    need('app_id', app ? [Validators.required, Validators.pattern(/^\d{1,12}$/)] : []);
    need('key', app ? [Validators.required] : []);
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
    try {
      if (value.kind === 'app') {
        await lastValueFrom(this.api.post(`${HTTP.API_BASE_URL}/user_access.add_app`, {
          label: value.label, app_id: value.app_id, api_url: value.api_url, key: value.key, scope: value.scope,
        }, {}));
      } else if (value.scope === 'company') {
        await lastValueFrom(this.api.post(`${HTTP.API_BASE_URL}/git_credentials.set`, {
          host: value.host, path: value.path, username: value.username, secret: value.token,
        }, {}));
      } else {
        await lastValueFrom(this.api.post(`${HTTP.API_BASE_URL}/user_access.add_token`, {
          label: value.label, host: value.host, path: value.path, token: value.token,
        }, {}));
      }
      this.dialogRef.close(true);
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The credential could not be saved.');
    } finally {
      this.saving.set(false);
    }
  }
}
