import {ChangeDetectionStrategy, Component, computed, inject, input, output, signal, viewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {EditProjectFormComponent} from '@common/shared/project-dialog/edit-project-form/edit-project-form.component';
import {updateProject as dialogUpdateProject} from '@common/shared/project-dialog/project-dialog.actions';
import {isReadOnly} from '@common/shared/utils/is-read-only';
import {Project} from '~/business-logic/model/projects/project';
import {ProjectsCreateRequest} from '~/business-logic/model/projects/projectsCreateRequest';
import {ProjectSettingsStore} from '~/features/dashboard-search/project-settings-dashboard-search-permissions.store';

/**
 * The general project settings: name, path and default output destination. Owns its form, its read-only rule and its save,
 * so a host (the settings dialog or the project settings page) only places it.
 */
@Component({
  selector: 'sm-project-general-settings',
  templateUrl: './project-general-settings.component.html',
  styleUrls: ['./project-general-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EditProjectFormComponent]
})
export class ProjectGeneralSettingsComponent {
  private store = inject(Store);
  private settingsStore = inject(ProjectSettingsStore);

  project = input.required<Project>();
  /** Emitted when the form asks to be closed without saving. */
  cancelled = output();

  protected form = viewChild.required(EditProjectFormComponent);
  private generalChanged = signal(false);
  private request: ProjectsCreateRequest = null;

  readonly = computed(() => isReadOnly(this.project()) || this.settingsStore.isReadOnly());
  hasChanges = computed(() => this.generalChanged());

  // A method, not a computed: the form's status is not a signal, so a computed would keep its first value.
  isInvalid(): boolean {
    return !!this.form()?.projectForm?.invalid;
  }

  updateGeneral(projectForm) {
    this.generalChanged.set(true);
    this.request = this.convertFormToProject(projectForm);
  }

  /** Stores the change, if there is one. The dialog id closes the dialog after a successful save. Returns whether a save was sent. */
  save(dialogId?: string): boolean {
    if (!this.generalChanged() || !this.request) {
      return false;
    }
    this.store.dispatch(dialogUpdateProject({req: {...this.request, project: this.project().id}, dialogId}));
    this.generalChanged.set(false);
    return true;
  }

  private convertFormToProject(projectForm: { parent: string; name: string; description?: string; system_tags?: string[]; default_output_destination?: string }): ProjectsCreateRequest {
    return {
      name: `${projectForm.parent === 'Projects root' ? '' : projectForm.parent + '/'}${projectForm.name}`,
      ...(projectForm.description && {description: projectForm.description}),
      ...(projectForm.system_tags && {system_tags: projectForm.system_tags}),
      default_output_destination: projectForm.default_output_destination
    };
  }
}
