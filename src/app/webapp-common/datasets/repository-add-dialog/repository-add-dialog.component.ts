import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogClose, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {Store} from '@ngrx/store';
import {lastValueFrom, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {addMessage} from '@common/core/actions/layout.actions';
import {MESSAGES_SEVERITY} from '@common/constants';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {RepoRole, RepositoriesService, StoredCredential} from '../dataset-git/repositories.service';
import {selectIsAdmin} from '@common/core/reducers/users-reducer';
import {toSignal} from '@angular/core/rxjs-interop';

// Lists a code repository, a dataset or a registry before any run uses it. The caller's entry is non-shared; the admin may make it
// shared. The caller's own credential can be assigned now.
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
    MatCheckboxModule,
    MatProgressSpinnerModule,
    DialogTemplateComponent,
    MatDialogClose,
  ],
})
export class RepositoryAddDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private access = inject(RepositoriesService);
  private projectsApi = inject(ApiProjectsService);
  private store = inject(Store);
  private dialogRef = inject(MatDialogRef<RepositoryAddDialogComponent, boolean>);
  // set when the dialog is opened from one project's settings: the repository is added to that project
  protected readonly fixedProject = inject<{project?: string} | null>(MAT_DIALOG_DATA, {optional: true})?.project ?? null;

  protected readonly isAdmin = toSignal(this.store.select(selectIsAdmin), {initialValue: false});
  protected readonly projects = signal<{id: string; name: string}[]>([]);
  protected readonly credentials = signal<StoredCredential[]>([]);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = this.fb.group({
    role: ['dataset' as RepoRole, Validators.required],
    url: ['', Validators.required],
    project: [this.fixedProject ?? ''],
    credential: [''],
    shared: [false],
  });

  ngOnInit() {
    this.projectsApi.projectsGetAllEx({order_by: ['name'], only_fields: ['name'], page_size: 500, size: 500})
      .pipe(catchError(() => of({projects: []})))
      .subscribe(response => this.projects.set((response.projects ?? []).map(project => ({id: project.id, name: project.name}))));
    this.access.credentials().pipe(catchError(() => of([] as StoredCredential[])))
      .subscribe(credentials => this.credentials.set(credentials.filter(credential => credential.scope === 'user' || credential.scope === 'company')));
  }

  protected async add() {
    if (this.form.invalid || this.saving()) {
      return;
    }
    const {role, url, project, credential, shared} = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    try {
      await lastValueFrom(this.access.add(url.trim(), role, {project, credential, shared}));
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, `Added ${url.trim()}`));
      this.dialogRef.close(true);
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The repository could not be added.');
    } finally {
      this.saving.set(false);
    }
  }
}
