import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatDialogClose, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {Store} from '@ngrx/store';
import {lastValueFrom, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {addMessage} from '@common/core/actions/layout.actions';
import {MESSAGES_SEVERITY} from '@common/constants';
import {DatasetAccessService, DATASET_VISIBILITY_LABELS, DatasetVisibility, StoredCredential} from '../dataset-git/dataset-access.service';

// Adds a dataset that already exists: a GitHub repository, or a registry (which adds every dataset it lists). Nothing is
// created or copied. A repository is read with the credential chosen here; a public one needs none.
@Component({
  selector: 'sm-dataset-add-dialog',
  templateUrl: './dataset-add-dialog.component.html',
  styleUrls: ['./dataset-add-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    DialogTemplateComponent,
    MatDialogClose,
  ],
})
export class DatasetAddDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private access = inject(DatasetAccessService);
  private store = inject(Store);
  private dialogRef = inject(MatDialogRef<DatasetAddDialogComponent, boolean>);

  protected readonly credentials = signal<StoredCredential[]>([]);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly visibilityOptions = (Object.keys(DATASET_VISIBILITY_LABELS) as DatasetVisibility[])
    .map(value => ({value, label: DATASET_VISIBILITY_LABELS[value]}));
  protected readonly form = this.fb.group({
    kind: ['repo' as 'repo' | 'registry', Validators.required],
    url: ['', Validators.required],
    credential: [''],
    visibility: ['user' as DatasetVisibility, Validators.required],
  });

  ngOnInit() {
    this.access.credentials().pipe(catchError(() => of([] as StoredCredential[])))
      .subscribe(list => this.credentials.set(list));
  }

  protected async add() {
    if (this.form.invalid || this.saving()) {
      return;
    }
    const {kind, url, credential, visibility} = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    try {
      const dataset = await lastValueFrom(this.access.add(kind, url.trim(), visibility, undefined,
        kind === 'repo' ? credential : ''));
      this.store.dispatch(dataset.state === 'no_access'
        ? addMessage(MESSAGES_SEVERITY.ERROR, dataset.state_message)
        : addMessage(MESSAGES_SEVERITY.SUCCESS, `Added ${dataset.name}`));
      this.dialogRef.close(true);
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The dataset could not be added.');
    } finally {
      this.saving.set(false);
    }
  }
}
