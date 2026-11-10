import {ChangeDetectionStrategy, Component, computed, effect, inject, input, signal} from '@angular/core';
import {NgOptimizedImage, NgTemplateOutlet} from '@angular/common';
import {ActivatedRoute, NavigationEnd, Router, RouterLink} from '@angular/router';
import {Store} from '@ngrx/store';
import {filter} from 'rxjs/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {selectDarkTheme, selectHeaderMenu, selectHeaderMenuIndex, selectBreadcrumbs} from '@common/core/reducers/view.reducer';
import {selectRouterConfig, selectRouterUrl} from '@common/core/reducers/router-reducer';
import {selectSelectedProject} from '@common/core/reducers/projects.reducer';
import {selectExperimentInfoData} from '~/features/experiments/reducers';
import {experimentLabel} from '@common/experiments/shared/experiment-label';
import {selectActiveWorkspace} from '@common/core/reducers/users-reducer';
import {selectArchive} from '@common/layout/layout.selectors';
import {setAutoRefresh} from '@common/core/actions/layout.actions';
import {ConfigurationService} from '@common/shared/services/configuration.service';
import {RefreshButtonComponent} from '@common/shared/components/refresh-button/refresh-button.component';
import {ShowOnlyUserWorkComponent} from '@common/shared/components/show-only-user-work/show-only-user-work.component';
import {HeaderNavbarTabsComponent} from '@common/layout/header-navbar-tabs/header-navbar-tabs.component';
import {PageHeaderService} from '@common/shared/ui-components/layout/page-header/page-header.service';
import {PageHeaderTitleService} from '@common/shared/ui-components/layout/page-header/page-header-title.service';
import {ExperimentNameService} from '../breadcrumbs/experiment-name.service';
import {deriveHeaderTitles} from './header-titles';

/**
 * The one header of the application: the title block on the left (line 1: what we look at, line 2: where it is), the tabs of
 * the page exactly in the middle, and the buttons of the page on the right. Search, help and the user menu are in the
 * side navigation. A page adds its own content with `sm-page-header` (see there); the title block works without it.
 */
@Component({
  selector: 'sm-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    NgOptimizedImage,
    RouterLink,
    RefreshButtonComponent,
    ShowOnlyUserWorkComponent,
    HeaderNavbarTabsComponent,
  ]
})
export class HeaderComponent {
  private store = inject(Store);
  private router = inject(Router);
  private activeRoute = inject(ActivatedRoute);
  private configService = inject(ConfigurationService);
  private experimentNameService = inject(ExperimentNameService);
  private pageTitle = inject(PageHeaderTitleService).title;

  isShareMode = input<boolean>();
  isLogin = input<boolean>();

  protected environment = this.configService.configuration;
  protected darkTheme = this.store.selectSignal(selectDarkTheme);
  protected content = inject(PageHeaderService).content;
  protected userFocus = signal<boolean>(false);
  protected hideSideNav = signal<boolean>(false);
  protected showAutoRefresh = signal<boolean>(false);

  private url = this.store.selectSignal(selectRouterUrl);
  private openExperiment = this.store.selectSignal(selectExperimentInfoData);
  private routeConfig = this.store.selectSignal(selectRouterConfig);
  private menu = this.store.selectSignal(selectHeaderMenu);
  private menuIndex = this.store.selectSignal(selectHeaderMenuIndex);
  private breadcrumbLinks = this.store.selectSignal(selectBreadcrumbs);
  private selectedProject = this.store.selectSignal(selectSelectedProject);
  private workspace = this.store.selectSignal(selectActiveWorkspace);
  private archive = this.store.selectSignal<boolean>(selectArchive);
  /** Names of the tasks looked up for the title, by id. */
  private experimentNames = signal<Record<string, string>>({});

  /** The browsed archive is shown next to the title, but not on the pages that have no archive. */
  protected showArchive = computed(() => this.archive() && !['overview', 'workloads', 'settings'].includes(this.routeConfig()?.at(-1)));
  protected hasTabs = computed(() => this.menu()?.length > 0);

  protected titles = computed(() => {
    const tab = this.menu()?.[this.menuIndex()];
    const project = this.selectedProject();
    return deriveHeaderTitles({
      url: this.url(),
      pageTitle: this.pageTitle(),
      crumbs: (this.breadcrumbLinks() ?? []).flat().filter(crumb => crumb?.name && !crumb.hidden).map(crumb => crumb.name),
      projectName: project?.name ?? null,
      experimentName: id => this.experimentNames()[id] ?? id,
      tab: tab ? (tab.label ?? tab.header) : null,
      workspace: this.workspace()?.name ?? null,
    });
  });

  constructor() {
    this.getRouteData();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.getRouteData());

    // the title is edited on the page: show the edited one
    effect(() => {
      const info = this.openExperiment();
      if (info?.id) {
        this.experimentNames.update(names => ({...names, [info.id]: experimentLabel(info) || names[info.id]}));
      }
    });

    // the name of the task is not in the url
    effect(() => {
      const [, , section, child] = (this.url() ?? '').split(/[?#]/)[0].split('/').filter(Boolean);
      if (section === 'tasks' && child && child !== 'compare' && !this.experimentNames()[child]) {
        this.experimentNameService.nameOf(child).then(name => this.experimentNames.update(names => ({...names, [child]: name})));
      }
    });
  }

  private getRouteData() {
    this.userFocus.set(!!this.activeRoute?.firstChild?.snapshot.data?.userFocus);
    this.hideSideNav.set(this.activeRoute?.firstChild?.snapshot.data.hideSideNav);
    let last = this.activeRoute;
    while (last.firstChild) {
      last = last.firstChild;
    }
    this.showAutoRefresh.set(last.snapshot.data.showAutoRefresh);
  }

  toggleAutoRefresh(autoRefresh: boolean) {
    this.store.dispatch(setAutoRefresh({autoRefresh}));
  }
}
