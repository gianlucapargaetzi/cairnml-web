import {ChangeDetectionStrategy, Component, input, output, computed} from '@angular/core';
import {CircleTypeEnum} from '~/shared/constants/non-common-consts';
import {ProjectsGetAllResponseSingle} from '~/business-logic/model/projects/projectsGetAllResponseSingle';
import {ICONS} from '@common/constants';
import {trackById} from '@common/shared/utils/forms-track-by';
import {ProjectTypeEnum} from '@common/nested-project-view/nested-project-view-page/nested-project-view-page.component';
import {CardComponent} from '@common/shared/ui-components/panel/card/card.component';
import {InlineEditComponent} from '@common/shared/ui-components/inputs/inline-edit/inline-edit.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ShortProjectNamePipe} from '@common/shared/pipes/short-project-name.pipe';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {CleanProjectPathPipe} from '@common/shared/pipes/clean-project-path.pipe';
import {BreadcrumbsEllipsisPipe} from '@common/shared/pipes/breadcrumbs-ellipsis.pipe';
import {referenceId} from '@common/shared/utils/reference';


@Component({
  selector: 'sm-nested-card',
  templateUrl: './nested-card.component.html',
  styleUrls: ['./nested-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardComponent,
    InlineEditComponent,
    TooltipDirective,
    ShortProjectNamePipe,
    ShowTooltipIfEllipsisDirective,
    CdkVirtualForOf,
    CdkFixedSizeVirtualScroll,
    CdkVirtualScrollViewport,
    ClickStopPropagationDirective,
    CleanProjectPathPipe,
    BreadcrumbsEllipsisPipe
  ]
})
export class NestedCardComponent {
  protected readonly referenceId = referenceId;

  trackById = trackById;
  protected readonly circleTypeEnum = CircleTypeEnum;
  protected readonly icons = ICONS;

  projectsNames = input<string[]>();
  project = input<ProjectsGetAllResponseSingle>();
  isRootProject = input();
  hideMenu = input(true);
  allTags = input<string[]>();
  entityType = input<ProjectTypeEnum>();
  addTag = output<string>();
  removeTag = output<string>();
  delete = output();
  projectCardClicked = output<{
        hasSubProjects: boolean;
        id: string;
        name: string;
    }>();
  projectNameChanged = output<string>();
  deleteProjectClicked = output<ProjectsGetAllResponseSingle>();

  protected projectClean = computed(() => ({...this.project(), sub_projects: this.project().sub_projects?.filter(subP => !subP.name.includes('.pipelines') && !subP.name.includes('.datasets') && !subP.name.includes('.reports'))}));

  public projectClicked() {
    const hasSubProjects = this.projectClean().sub_projects?.filter((subProject) => (!subProject.name.slice(this.projectClean().name.length).startsWith(`/.${this.entityType()}`))).length > 0;
    this.projectCardClicked.emit({hasSubProjects, id: this.projectClean().id, name: this.projectClean().name});
  }

  subProjectClicked(project: ProjectsGetAllResponseSingle) {
    const hasSubProjects = this.projectClean().sub_projects?.filter(pr => pr.name.startsWith(`${project.name}/`))
      .filter((subProject) => {
        const realSubProject = subProject.name.slice(project.name.length);
        return !!realSubProject && !realSubProject.startsWith(`/.${this.entityType()}`);
      }).length > 0;
    this.projectCardClicked.emit({hasSubProjects, id: project.id, name: project.name});

  }

  prepareProjectNameForChange(projectName: string) {
    this.projectNameChanged.emit(this.projectClean().name.substring(0, this.projectClean().name.lastIndexOf('/') + 1) + projectName);
  }
}
