import {ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked, viewChild} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {filter, map, switchMap} from 'rxjs/operators';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {Store} from '@ngrx/store';
import {MatButton} from '@angular/material/button';
import {ProjectScalarDefaultsComponent} from '@common/shared/project-dialog/project-settings/project-scalar-defaults/project-scalar-defaults.component';
import {ProjectMembersComponent} from '@common/shared/project-dialog/project-settings/project-members/project-members.component';
import {ProjectQueuesComponent} from '@common/shared/project-dialog/project-settings/project-queues/project-queues.component';
import {ProjectOverviewSettingsComponent} from '@common/shared/project-dialog/project-settings/project-overview-settings/project-overview-settings.component';
import {ProjectNotificationsComponent} from '@common/shared/project-dialog/project-settings/project-notifications/project-notifications.component';
import {ProjectGeneralSettingsComponent} from '@common/shared/project-dialog/project-settings/project-general-settings/project-general-settings.component';
import {ProjectSettingsStore} from '~/features/dashboard-search/project-settings-dashboard-search-permissions.store';
import {HeaderMenuService} from '~/shared/services/header-menu.service';
import {selectSelectedProject} from '@common/core/reducers/projects.reducer';
import {setSelectedProjectId} from '@common/core/actions/projects.actions';

/**
 * The project settings as a page: general, overview, scalar view defaults, queues, notifications and users.
 */
@Component({
  selector: 'sm-project-settings-page',
  templateUrl: './project-settings-page.component.html',
  styleUrls: ['./project-settings-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProjectSettingsStore],
  imports: [
    MatButton,
    ProjectGeneralSettingsComponent,
    ProjectScalarDefaultsComponent,
    ProjectMembersComponent,
    ProjectQueuesComponent,
    ProjectOverviewSettingsComponent,
    ProjectNotificationsComponent
  ]
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

  protected general = viewChild(ProjectGeneralSettingsComponent);
  protected scalars = viewChild(ProjectScalarDefaultsComponent);

  protected dirty = computed(() => !!this.general()?.hasChanges() || !!this.scalars()?.hasChanges());

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

  save() {
    if (this.general()?.save()) {
      this.store.dispatch(setSelectedProjectId({projectId: this.projectId()}));
    }
    this.scalars()?.save();
  }
}
