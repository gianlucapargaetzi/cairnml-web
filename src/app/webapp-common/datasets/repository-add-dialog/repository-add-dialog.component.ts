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
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {DatasetAccessService} from '../dataset-git/dataset-access.service';

// Lists a code repository before any run uses it, for one of the caller's projects. Its credential is assigned from the
// Repositories tab afterwards, by the project's owner or the first user of it there.
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
  private projectsApi = inject(ApiProjectsService);
  private store = inject(Store);
  private dialogRef = inject(MatDialogRef<RepositoryAddDialogComponent, boolean>);

  protected readonly projects = signal<{id: string; name: string}[]>([]);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = this.fb.group({
    url: ['', Validators.required],
    project: [''],
  });

  ngOnInit() {
    this.projectsApi.projectsGetAllEx({order_by: ['name'], only_fields: ['name'], page_size: 500, size: 500})
      .pipe(catchError(() => of({projects: []})))
      .subscribe(response => this.projects.set((response.projects ?? []).map(project => ({id: project.id, name: project.name}))));
  }

  protected async add() {
    if (this.form.invalid || this.saving()) {
      return;
    }
    const {url, project} = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    try {
      await lastValueFrom(this.access.addRepository(url.trim(), project));
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, `Added ${url.trim()}`));
      this.dialogRef.close(true);
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The repository could not be added.');
    } finally {
      this.saving.set(false);
    }
  }
}
