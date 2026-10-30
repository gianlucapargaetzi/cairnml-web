import {ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked, viewChild} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {filter, map, switchMap} from 'rxjs/operators';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {Store} from '@ngrx/store';
import {MatButton} from '@angular/material/button';
import {EditProjectFormComponent} from '@common/shared/project-dialog/edit-project-form/edit-project-form.component';
import {updateProject as dialogUpdateProject} from '@common/shared/project-dialog/project-dialog.actions';
import {ProjectScalarDefaultsComponent} from '@common/shared/project-dialog/project-settings/project-scalar-defaults/project-scalar-defaults.component';
import {ProjectMembersComponent} from '@common/shared/project-dialog/project-settings/project-members/project-members.component';
import {ProjectSettingsStore} from '~/features/dashboard-search/project-settings-dashboard-search-permissions.store';
import {HeaderMenuService} from '~/shared/services/header-menu.service';
import {selectSelectedProject} from '@common/core/reducers/projects.reducer';
import {isReadOnly} from '@common/shared/utils/is-read-only';
import {ProjectsCreateRequest} from '~/business-logic/model/projects/projectsCreateRequest';
import {setSelectedProjectId} from '@common/core/actions/projects.actions';

/**
 * The project settings as a page, the same settings as the project settings dialog: general, scalar view defaults and users.
 */
@Component({
  selector: 'sm-project-settings-page',
  templateUrl: './project-settings-page.component.html',
  styleUrls: ['./project-settings-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProjectSettingsStore],
  imports: [MatButton, EditProjectFormComponent, ProjectScalarDefaultsComponent, ProjectMembersComponent]
})
export class ProjectSettingsPageComponent {
  private store = inject(Store);
  private settingsStore = inject(ProjectSettingsStore);
  private headerMenu = inject(HeaderMenuService);
  private projectsApi = inject(ApiProjectsService);

  protected project = this.store.selectSignal(selectSelectedProject);
  protected projectId = computed(() => this.project()?.id);
  // The read-only check needs the company as an object, which the store's copy of the project may not have: load it like the project cards do.
  protected fullProject = toSignal(
    toObservable(this.projectId).pipe(
      filter(projectId => !!projectId),
      switchMap(projectId => this.projectsApi.projectsGetAllEx({id: [projectId]}).pipe(map(res => res.projects?.[0])))
    )
  );
  protected readonlyProject = computed(() => !!this.fullProject() && (isReadOnly(this.fullProject()) || this.settingsStore.isReadOnly()));

  protected generalForm = viewChild(EditProjectFormComponent);
  protected scalars = viewChild(ProjectScalarDefaultsComponent);
  protected generalChanged = signal(false);
  private generalRequest: ProjectsCreateRequest = null;

  protected dirty = computed(() => this.generalChanged() || !!this.scalars()?.hasChanges());

  // Read when rendering, not in a computed: the form's status is not a signal, so a computed would keep its first value.
  protected generalInvalid(): boolean {
    return !!this.generalForm()?.projectForm?.invalid;
  }

  constructor() {
    effect(() => {
      const projectId = this.projectId();
      if (projectId) {
        untracked(() => {
          this.headerMenu.setupProjectHeaderTabs('settings', projectId, false);
          this.settingsStore.setProject(projectId);
          this.settingsStore.loadScalars();
          this.settingsStore.loadMembers();
          this.settingsStore.loadCompanyUsers();
        });
      }
    });
  }

  updateGeneral(projectForm) {
    this.generalChanged.set(true);
    this.generalRequest = this.convertFormToProject(projectForm);
  }

  save() {
    if (this.generalChanged() && this.generalRequest) {
      this.store.dispatch(dialogUpdateProject({req: {...this.generalRequest, project: this.projectId()}, dialogId: null}));
      this.store.dispatch(setSelectedProjectId({projectId: this.projectId()}));
      this.generalChanged.set(false);
    }
    this.scalars()?.save();
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
