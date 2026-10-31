import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Input,
  signal,
  viewChild,
  viewChildren
} from '@angular/core';
import {Store} from '@ngrx/store';
import {debounceTime} from 'rxjs/operators';
import {ActivatedRoute, Params, RouterLink, UrlTree} from '@angular/router';
import {fromEvent} from 'rxjs';
import {addMessage} from '../../core/actions/layout.actions';
import {ConfigurationService} from '../../shared/services/configuration.service';
import {
  GetCurrentUserResponseUserObjectCompany
} from '~/business-logic/model/users/getCurrentUserResponseUserObjectCompany';
import {selectShowHiddenUserSelection} from '../../core/reducers/projects.reducer';
import {MESSAGES_SEVERITY} from '@common/constants';
import {selectBreadcrumbs, selectWorkspaceNeutral} from '@common/core/reducers/view.reducer';
import {MatMenuModule} from '@angular/material/menu';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';

import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {ClipboardModule} from 'ngx-clipboard';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {TagListComponent} from '@common/shared/ui-components/tags/tag-list/tag-list.component';
import {cloneItemIntoDummy} from '@common/shared/utils/shared-utils';
import {IdBadgeComponent} from '@common/shared/components/id-badge/id-badge.component';
import {toSignal} from '@angular/core/rxjs-interop';
import {selectArchive, selectProjectsFeature} from '@common/layout/layout.selectors';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {MatBadgeModule} from '@angular/material/badge';
import {selectRouterConfig, selectRouterUrl} from '@common/core/reducers/router-reducer';
import {selectSelectedProject} from '@common/core/reducers/projects.reducer';
import {ExperimentNameService} from './experiment-name.service';
import {PageHeaderTitleService} from '@common/shared/ui-components/layout/page-header/page-header-title.service';
import {levelBreadcrumbs} from './level-breadcrumbs';

export enum CrumbTypeEnum {
  Workspace = 'Workspace',
  Feature = 'Feature',
  Project = 'Project',
  SubFeature = 'SubFeature',
}

export interface IBreadcrumbsLink {
  name?: string;
  url?: string | UrlTree;
  urlParams?: Params;
  queryParamsHandling?: 'merge' | 'preserve' | '';
  linkLast?: boolean;
  subCrumbs?: { name?: string; url: string; hidden?: boolean }[];
  isProject?: boolean;
  type?: CrumbTypeEnum;
  hidden?: boolean;
  collapsable?: boolean;
  example?: boolean;
  id?: string;
  tags?: string[];
  badge?: string;
  badgeWarn?: boolean;
  badgeTooltip?: string;
  onlyWithProject?: boolean;
}

export interface IBreadcrumbsOptions {
  showProjects: boolean;
  featureBreadcrumb: IBreadcrumbsLink;
  subFeatureBreadcrumb?: IBreadcrumbsLink;
  projectsOptions?: {
    basePath: string;
    noSubProjectsRedirectPath?: string;
    filterBaseNameWith: string[];
    compareModule: string;
    showSelectedProject: boolean;
    queryParamsHandling?: 'merge' | 'preserve' | '';
    selectedProjectBreadcrumb: IBreadcrumbsLink;
  };
}

@Component({
    selector: 'sm-breadcrumbs',
    templateUrl: './breadcrumbs.component.html',
    styleUrls: ['./breadcrumbs.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {'[class.empty]': 'breadcrumbs().length === 0 && !isCommunity()'},
  imports: [
    MatMenuModule,
    TooltipDirective,
    ShowTooltipIfEllipsisDirective,
    ClipboardModule,
    RouterLink,
    ClickStopPropagationDirective,
    TagListComponent,
    IdBadgeComponent,
    MatIcon,
    MatIconButton,
    MatBadgeModule
  ]
})
export class BreadcrumbsComponent {
  private store = inject(Store);
  public route = inject(ActivatedRoute);
  private configService = inject(ConfigurationService);
  private cd = inject(ChangeDetectorRef);
  public currentUrl: string;
  public showShareButton = false;
  public subProjectsMenuIsOpen: boolean;

  @Input() activeWorkspace: GetCurrentUserResponseUserObjectCompany;
  protected environment = toSignal(this.configService.getEnvironment());
  private resize = toSignal(fromEvent(window, 'resize').pipe(debounceTime(100)));
  protected projectFeature = this.store.selectSignal(selectProjectsFeature);
  protected showHidden = this.store.selectSignal(selectShowHiddenUserSelection);
  protected workspaceNeutral = this.store.selectSignal(selectWorkspaceNeutral);
  protected archive = this.store.selectSignal<boolean>(selectArchive);
  private routeConfig = this.store.selectSignal(selectRouterConfig);
  protected showArchive = computed(() => this.archive() && !['overview', 'workloads', 'settings'].includes(this.routeConfig().at(-1)));
  private breadCrumbsContainer = viewChild<ElementRef<HTMLDivElement>>('container');
  private crumbElements=  viewChildren<ElementRef<HTMLDivElement>>('crumb');
  protected breadcrumbLinks = this.store.selectSignal<IBreadcrumbsLink[][]>(selectBreadcrumbs);
  private experimentNameService = inject(ExperimentNameService);
  private url = this.store.selectSignal(selectRouterUrl);
  private selectedProject = this.store.selectSignal(selectSelectedProject);
  /** Names of experiments looked up for the title, by id. */
  private experimentNames = signal<Record<string, string>>({});
  /** The fixed title of the current level (project, task, experiment), or null outside these levels. */
  private levelLinks = computed(() => levelBreadcrumbs(
    this.url(),
    this.selectedProject()?.basename ?? this.selectedProject()?.name,
    id => this.experimentNames()[id] ?? id,
  ));

  private resolveExperimentName = effect(() => {
    const [, , section, child] = (this.url() ?? '').split(/[?#]/)[0].split('/').filter(Boolean);
    if (section === 'tasks' && child && child !== 'compare' && !this.experimentNames()[child]) {
      this.experimentNameService.nameOf(child).then(name => this.experimentNames.update(names => ({...names, [child]: name})));
    }
  });

  private pageHeaderTitle = inject(PageHeaderTitleService).title;

  // The last crumb is dropped when it repeats the title of the page header (the title is shown once, in the header).
  protected breadcrumbs = computed(() => {
    const groups = (this.levelLinks() ?? this.breadcrumbLinks())
      .map(breadcrumbsGroup => breadcrumbsGroup?.filter( breadcrumb =>
        (!breadcrumb.hidden) || (this.showHidden() && this.projectFeature())
      ))
      .filter(breadcrumbsGroup => breadcrumbsGroup?.length > 0) ?? [];
    const title = this.pageHeaderTitle();
    const lastGroup = groups.at(-1);
    if (title && lastGroup?.at(-1)?.name === title) {
      return [...groups.slice(0, -1), lastGroup.slice(0, -1)].filter(group => group.length > 0);
    }
    return groups;
  });
  protected isCommunity = computed(() => this.environment().communityServer);
  protected shouldCollapse: boolean;


  constructor(
  ) {
    effect(() => {
      this.resize();
      if (this.breadCrumbsContainer()) {
        this.shouldCollapse = false;
        this.cd.detectChanges();
        const lastCrumb = this.crumbElements().at(-1)?.nativeElement;
        if (!lastCrumb) {
          this.cd.markForCheck();
          return;
        }
        const dummyContainer = document.createElement('span');
        dummyContainer.style.position = 'fixed';
        this.breadCrumbsContainer().nativeElement.appendChild(dummyContainer);
        cloneItemIntoDummy(lastCrumb, dummyContainer);
        const width = dummyContainer.offsetWidth;
        this.breadCrumbsContainer().nativeElement.removeChild(dummyContainer);
        this.shouldCollapse = lastCrumb.clientWidth < width;
        this.cd.markForCheck();
      }
    });

  }

  openShareModal() {
    this.currentUrl = window.location.href;
  }

  copyToClipboardSuccess() {
    this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'URL copied successfully'));
  }


  subProjectsMenuOpened(b: boolean) {
    this.subProjectsMenuIsOpen = b;
  }

  copyToClipboard() {
    this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'ID copied to clipboard'));
  }
}
