import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {MatDialogClose, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {lastValueFrom} from 'rxjs';
import {HTTP} from '~/app.constants';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';

const HOST_PATTERN = /^[A-Za-z0-9.-]+(:[0-9]+)?$/;

@Component({
  selector: 'sm-add-git-credential-dialog',
  templateUrl: './add-git-credential-dialog.component.html',
  styleUrls: ['./add-git-credential-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogClose,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    DialogTemplateComponent
  ]
})
export class AddGitCredentialDialogComponent {
  private dialogRef = inject<MatDialogRef<AddGitCredentialDialogComponent, boolean>>(MatDialogRef);
  private apiRequest = inject(SmApiRequestsService);
  private fb = inject(FormBuilder);

  protected saving = signal(false);
  protected error = signal<string | null>(null);

  protected form = this.fb.nonNullable.group({
    host: ['', [Validators.required, Validators.pattern(HOST_PATTERN)]],
    path: [''],
    username: ['', Validators.required],
    secret: ['', Validators.required]
  });

  protected async save() {
    if (this.form.invalid || this.saving()) {
      return;
    }
    const {host, path, username, secret} = this.form.getRawValue();
    // the secret leaves the form at once, whatever the answer of the server
    this.form.controls.secret.setValue('');
    this.form.controls.secret.markAsUntouched();
    this.saving.set(true);
    this.error.set(null);
    try {
      await lastValueFrom(this.apiRequest.post(`${HTTP.API_BASE_URL}/git_credentials.set`, {
        host: host.trim(),
        path: path.trim(),
        username: username.trim(),
        secret
      }, {}));
      this.dialogRef.close(true);
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The credential could not be saved. Enter the secret again.');
    } finally {
      this.saving.set(false);
    }
  }
}
