import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogClose, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {lastValueFrom, Observable} from 'rxjs';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {RepositoriesService, StoredCredential} from '../dataset-git/repositories.service';

// What the dialog changes: the name shown, the credential now set, and how the choice is saved (a dataset or a repository).
export interface CredentialChangeData {
  name: string;
  credential: string | null;
  save: (credential: string, noneNeeded?: boolean) => Observable<unknown>;
  // The credentials to choose from, when the caller knows them (a repository binding: the server lists what the user may
  // assign). Without it the dialog reads the user's own and the company's.
  options?: {id: string; name: string; type: string; scope: 'user' | 'company'}[];
  // "None needed" is offered (the host clones the repository without a credential), and whether it is the current choice
  noneNeededLabel?: string;
  noneNeeded?: boolean;
  // the current choice can be cleared back to "not assigned"
  clearable?: boolean;
}

export const NONE_NEEDED = '__none_needed__';
export const NOT_ASSIGNED = '__not_assigned__';

// Chooses the credential a dataset is read with, from the credentials the user may use: their own, and the company's.
// The server checks the choice again (the credential must read the repository), and says why when it refuses.
@Component({
  selector: 'sm-dataset-credential-dialog',
  templateUrl: './dataset-credential-dialog.component.html',
  styleUrls: ['./dataset-credential-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    DialogTemplateComponent,
    MatDialogClose,
  ],
})
export class DatasetCredentialDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private access = inject(RepositoriesService);
  private dialogRef = inject(MatDialogRef<DatasetCredentialDialogComponent, unknown>);
  protected data = inject<CredentialChangeData>(MAT_DIALOG_DATA);

  // null while the list is read
  protected readonly credentials = signal<StoredCredential[] | null>(null);
  protected readonly loadError = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly none = NONE_NEEDED;
  protected readonly notAssigned = NOT_ASSIGNED;
  protected readonly form = this.fb.group({
    credential: [this.data.noneNeeded ? NONE_NEEDED : (this.data.credential ?? ''), Validators.required],
  });

  ngOnInit() {
    if (this.data.options) {
      this.credentials.set(this.data.options.map(option => ({
        id: option.id, name: option.name, type: option.type, scope: option.scope, owner: '', valid_for: '', state: '',
      })));
      return;
    }
    this.access.credentials().subscribe({
      next: list => this.credentials.set(list),
      error: () => {
        this.loadError.set(true);
        this.credentials.set([]);
      },
    });
  }

  protected async save() {
    if (this.form.invalid || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      const choice = this.form.controls.credential.value ?? '';
      const saved = await lastValueFrom(choice === NONE_NEEDED ? this.data.save('', true) :
        choice === NOT_ASSIGNED ? this.data.save('', false) : this.data.save(choice));
      this.dialogRef.close(saved);
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The credential could not be set.');
    } finally {
      this.saving.set(false);
    }
  }
}
