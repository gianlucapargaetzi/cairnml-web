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
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogRef} from '@angular/material/dialog';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {Project} from '~/business-logic/model/projects/project';
import {MatTab, MatTabGroup, MatTabLabel} from '@angular/material/tabs';
import {CdkPortalOutlet} from '@angular/cdk/portal';
import {ProjectSettingsStore} from '~/features/dashboard-search/project-settings-dashboard-search-permissions.store';
import {ProjectScalarDefaultsComponent} from './project-scalar-defaults/project-scalar-defaults.component';
import {ProjectMembersComponent} from './project-members/project-members.component';
import {ProjectGeneralSettingsComponent} from './project-general-settings/project-general-settings.component';
import {ProjectQueuesComponent} from './project-queues/project-queues.component';
import {ProjectDatasetsComponent} from './project-datasets/project-datasets.component';
import {ProjectAccessesComponent} from './project-accesses/project-accesses.component';

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
    ProjectGeneralSettingsComponent,
    MatDialogActions,
    MatTabLabel,
    ProjectScalarDefaultsComponent,
    ProjectMembersComponent,
    ProjectQueuesComponent,
    ProjectDatasetsComponent,
    ProjectAccessesComponent
  ]
})
export class ProjectSettingsDialogComponent {
  protected settingsStore = inject(ProjectSettingsStore);
  private dialogRef = inject(MatDialogRef);
  protected readonly data: ProjectSettingsDialogConfig = inject(MAT_DIALOG_DATA);

  protected scalars = viewChild.required(ProjectScalarDefaultsComponent);
  protected general = viewChild.required(ProjectGeneralSettingsComponent);

  dialogTitle = signal<string>(`Project settings: "${this.data.project.name}"`);
  extraTabs = contentChildren(MatTab);
  extraDirty = input<boolean>(false);
  isEditing = input<boolean>(false);
  saveExtra = output();
  cancelExtra = output();
  selectedTabIndex = signal(0);
  // The Datasets and Credentials tabs save with their own Save button (the tab order is fixed: General, Scalar view
  // defaults, Users, Queues, Datasets, Credentials), so the dialog footer does not offer a second one there.
  private readonly sectionTabIndexes = [4, 5];
  protected readonly isSectionTab = computed(() => this.sectionTabIndexes.includes(this.selectedTabIndex()));

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

  save() {
    this.saveExtra.emit();
    this.scalars().save();
    const generalSaved = this.general().save(this.dialogRef.id);
    if (!this.isEditing() && !generalSaved) {
      this.dialogRef.close();
    }
  }
}
