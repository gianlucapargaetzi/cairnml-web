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
import {DatasetAccessService, StoredCredential} from '../dataset-git/dataset-access.service';

// Lists a code repository before any run uses it. The caller owns it, and it is read with the GitHub App chosen here.
@Component({
  selector: 'sm-repository-add-dialog',
  templateUrl: './repository-add-dialog.component.html',
  styleUrls: ['./repository-add-dialog.component.scss'],
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
export class RepositoryAddDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private access = inject(DatasetAccessService);
  private store = inject(Store);
  private dialogRef = inject(MatDialogRef<RepositoryAddDialogComponent, boolean>);

  protected readonly credentials = signal<StoredCredential[]>([]);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = this.fb.group({
    url: ['', Validators.required],
    credential: [''],
  });

  ngOnInit() {
    this.access.credentials().pipe(catchError(() => of([] as StoredCredential[])))
      .subscribe(list => this.credentials.set(list));
  }

  protected async add() {
    if (this.form.invalid || this.saving()) {
      return;
    }
    const {url, credential} = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    try {
      const repo = await lastValueFrom(this.access.addRepository(url.trim(), credential));
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, `Added ${repo.ref}`));
      this.dialogRef.close(true);
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The repository could not be added.');
    } finally {
      this.saving.set(false);
    }
  }
}
