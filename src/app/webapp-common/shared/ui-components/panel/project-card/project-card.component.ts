import {ChangeDetectionStrategy, Component, Input, output, ViewChild, input } from '@angular/core';
import {ProjectsGetAllResponseSingle} from '~/business-logic/model/projects/projectsGetAllResponseSingle';
import {CircleTypeEnum} from '~/shared/constants/non-common-consts';
import {Project} from '~/business-logic/model/projects/project';
import {trackById} from '@common/shared/utils/forms-track-by';
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {CardComponent} from '@common/shared/ui-components/panel/card/card.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {BreadcrumbsEllipsisPipe} from '@common/shared/pipes/breadcrumbs-ellipsis.pipe';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {CircleCounterComponent} from '@common/shared/ui-components/indicators/circle-counter/circle-counter.component';

import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {ProjectCardMenuExtendedComponent} from '~/features/projects/containers/project-card-menu-extended/project-card-menu-extended.component';
import { MatIconModule } from '@angular/material/icon';
import { MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions } from '@angular/material/tooltip';


@Component({
    selector: 'sm-project-card',
    templateUrl: './project-card.component.html',
    styleUrls: ['./project-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers:[{
      provide: MAT_TOOLTIP_DEFAULT_OPTIONS, 
      useValue: {showDelay: 500, hideDelay: 100, position: 'above'} as MatTooltipDefaultOptions
    },],
  imports: [
    CdkVirtualScrollViewport,
    CardComponent,
    TooltipDirective,
    BreadcrumbsEllipsisPipe,
    ShowTooltipIfEllipsisDirective,
    CircleCounterComponent,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    ClickStopPropagationDirective,
    ProjectCardMenuExtendedComponent,
    MatIconModule
  ]
})
export class ProjectCardComponent {
  private _project: ProjectsGetAllResponseSingle;
  public computeTime: string;
  public hidden = false;
  trackById = trackById;
  readonly circleTypeEnum = CircleTypeEnum;

  projectsNames = input<string[]>();

  @Input() set project(data: Project) {
    this._project = data;
    this.hidden = data.hidden || data.system_tags?.includes('hidden');
    this.computeTime = this.convertSecToDaysHrsMinsSec(data.stats?.active?.total_runtime);
  };

  get project() {
    return this._project;
  }

  isRootProject = input();
  hideProjectPathIcon = input(false);
  hideMenu = input(false);
  settingsOnly = input(false);
  projectCardClicked = output<Project>();
  projectNameChanged = output<string>();
  deleteProjectClicked = output<Project>();
  moveToClicked = output<Project>();
  newProjectClicked = output<Project>();
  projectEditClicked = output<Project>();
  projectSettingsClicked = output<Project>();
  @ViewChild('projectName', {static: true}) projectName;


  /** Formats a duration in seconds as "N DAYS HH:MM:SS"; fractions of a second are dropped. */
  public convertSecToDaysHrsMinsSec(secs: number) {
    const total = Math.max(0, Math.floor(secs ?? 0));
    const dayInSec = 60 * 60 * 24;
    const hourInSec = 60 * 60;
    const minInSec = 60;
    const d = Math.floor(total / dayInSec);
    const h = Math.floor((total % dayInSec) / hourInSec);
    const m = Math.floor((total % hourInSec) / minInSec);
    const s = total % minInSec;
    const pad = (n: number) => String(n).padStart(2, '0');
    const days = d === 1 ? `${d} DAY ` : d > 1 ? `${d} DAYS ` : '';
    return `${days}${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  public projectClicked() {
      this.projectCardClicked.emit(this.project);
  }

  // Enter on the focused card opens the project. Keys pressed on a control inside the card (its menu) are left to it.
  public projectKeyActivated(event: Event) {
      if (event.target === event.currentTarget) {
          event.preventDefault();
          this.projectClicked();
      }
  }



  subProjectClicked(id: string) {
    this.projectCardClicked.emit({id});
  }

  prepareProjectNameForChange(projectName: string) {
    this.projectNameChanged.emit(this.project.name.substring(0, this.project.name.lastIndexOf('/') + 1) + projectName);
  }
}
