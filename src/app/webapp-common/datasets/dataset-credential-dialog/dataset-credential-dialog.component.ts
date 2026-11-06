import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogClose, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {lastValueFrom} from 'rxjs';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {AccessDataset, DatasetAccessService, StoredCredential} from '../dataset-git/dataset-access.service';

export interface DatasetCredentialData {
  dataset: AccessDataset;
}

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
  private access = inject(DatasetAccessService);
  private dialogRef = inject(MatDialogRef<DatasetCredentialDialogComponent, AccessDataset>);
  protected data = inject<DatasetCredentialData>(MAT_DIALOG_DATA);

  // null while the list is read
  protected readonly credentials = signal<StoredCredential[] | null>(null);
  protected readonly loadError = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = this.fb.group({credential: [this.data.dataset.credential ?? '', Validators.required]});

  ngOnInit() {
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
      const repository = `https://github.com/${this.data.dataset.ref}`;
      const dataset = await lastValueFrom(this.access.setCredential(repository, this.form.controls.credential.value ?? ''));
      this.dialogRef.close(dataset);
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The credential could not be set.');
    } finally {
      this.saving.set(false);
    }
  }
}
