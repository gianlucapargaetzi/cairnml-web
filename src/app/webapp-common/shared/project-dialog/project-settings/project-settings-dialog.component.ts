import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatButton} from '@angular/material/button';
import {Store} from '@ngrx/store';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogRef} from '@angular/material/dialog';
import {isReadOnly} from '@common/shared/utils/is-read-only';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {Project} from '~/business-logic/model/projects/project';
import {MatTab, MatTabGroup, MatTabLabel} from '@angular/material/tabs';
import {CdkPortalOutlet} from '@angular/cdk/portal';
import {EditProjectFormComponent} from '@common/shared/project-dialog/edit-project-form/edit-project-form.component';
import {ProjectsCreateRequest} from '~/business-logic/model/projects/projectsCreateRequest';
import {updateProject as dialogUpdateProject} from '@common/shared/project-dialog/project-dialog.actions';
import {ProjectSettingsStore} from '~/features/dashboard-search/project-settings-dashboard-search-permissions.store';
import {ProjectScalarDefaultsComponent} from './project-scalar-defaults/project-scalar-defaults.component';
import {ProjectMembersComponent} from './project-members/project-members.component';

export interface ProjectSettingsDialogConfig {
  project: Project;
}

@Component({
  selector: 'sm-project-settings',
  templateUrl: './project-settings-dialog.component.html',
  styleUrls: ['./project-settings-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProjectSettingsStore],
  imports: [
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatButton,
    DialogTemplateComponent,
    MatTabGroup,
    MatTab,
    CdkPortalOutlet,
    EditProjectFormComponent,
    MatDialogActions,
    MatTabLabel,
    ProjectScalarDefaultsComponent,
    ProjectMembersComponent
  ]
})
export class ProjectSettingsDialogComponent {
  protected store = inject(Store);
  protected settingsStore = inject(ProjectSettingsStore);
  private dialogRef = inject(MatDialogRef);
  protected readonly data: ProjectSettingsDialogConfig = inject(MAT_DIALOG_DATA);

  protected scalars = viewChild.required(ProjectScalarDefaultsComponent);
  protected generalChanged = signal(false);
  protected readonlyProject = computed(() => isReadOnly(this.data.project) || this.settingsStore.isReadOnly());
  private project: Project;

  dialogTitle = signal<string>(`PROJECT SETTINGS: "${this.data.project.name}"`);
  extraTabs = contentChildren(MatTab);
  extraDirty = input<boolean>(false);
  isEditing = input<boolean>(false);
  saveExtra = output();
  cancelExtra = output();
  selectedTabIndex = signal(0);

  constructor() {
    this.settingsStore.setProject(this.data.project.id);
    this.settingsStore.loadScalars();
    this.settingsStore.loadMembers();
    this.settingsStore.loadCompanyUsers();
  }

  tabChanged(index: number) {
    if (this.isEditing()) {
      this.cancelExtra.emit();
    }
    this.selectedTabIndex.set(index);
  }

  closeDialog() {
    if (this.isEditing()) {
      this.cancelExtra.emit();
    } else {
      this.dialogRef.close();
    }
  }

  updateProject(projectForm) {
    this.generalChanged.set(true);
    this.project = this.convertFormToProject(projectForm);
  }

  private convertFormToProject(projectForm: { parent: string; name: string; description?: string; system_tags?: string[]; default_output_destination?: string }): ProjectsCreateRequest {
    return {
      name: `${projectForm.parent === 'Projects root' ? '' : projectForm.parent + '/'}${projectForm.name}`,
      ...(projectForm.description && {description: projectForm.description}),
      ...(projectForm.system_tags && {system_tags: projectForm.system_tags}),
      default_output_destination: projectForm.default_output_destination
    };
  }

  save() {
    this.saveExtra.emit();
    this.scalars().save();
    if (this.generalChanged()) {
      this.store.dispatch(dialogUpdateProject({req: {...this.project, project: this.data.project.id}, dialogId: this.dialogRef.id}));
    }
    if (!this.isEditing() && !this.generalChanged()) {
      this.dialogRef.close();
    }
  }
}
