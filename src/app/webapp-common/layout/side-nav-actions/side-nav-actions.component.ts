import {ChangeDetectionStrategy, Component, inject, input, OnInit, Type} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {ActivatedRoute, NavigationEnd, Router, RouterLink} from '@angular/router';
import {Store} from '@ngrx/store';
import {MatIconModule} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {debounceTime, filter} from 'rxjs/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ChangesService} from '@common/shared/services/changes.service';
import {TipsService} from '@common/shared/services/tips.service';
import {ConfigurationService} from '@common/shared/services/configuration.service';
import {selectCurrentUser, selectIsAdmin} from '@common/core/reducers/users-reducer';
import {logout} from '@common/core/actions/users.actions';
import {selectForcedTheme} from '@common/core/reducers/view.reducer';
import {LoginService} from '~/shared/services/login.service';
import {selectUserSettingsNotificationPath} from '~/core/reducers/view.reducer';
import {selectInvitesPending} from '~/core/reducers/users.reducer';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {HeaderUserMenuActionsComponent} from '~/layout/header/header-user-menu-actions/header-user-menu-actions.component';
import {WelcomeMessageComponent} from '../welcome-message/welcome-message.component';
import {AppearanceComponent} from '../appearance/appearance.component';

/**
 * Search all, help and the user menu, stacked at the bottom of the side navigation (the user menu lowest).
 * They used to sit in the top bar, which is now the page header.
 */
@Component({
  selector: 'sm-side-nav-actions',
  templateUrl: './side-nav-actions.component.html',
  styleUrls: ['./side-nav-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'globalSearchTrigger($event)'
  },
  imports: [
    HeaderUserMenuActionsComponent,
    MatIconModule,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatIconButton,
    RouterLink,
    TooltipDirective,
  ]
})
export class SideNavActionsComponent implements OnInit {
  private store = inject(Store);
  private dialog = inject(MatDialog);
  private loginService = inject(LoginService);
  private router = inject(Router);
  private activeRoute = inject(ActivatedRoute);
  private configService = inject(ConfigurationService);
  public tipsService = inject(TipsService);
  public changesService = inject(ChangesService);
  private searchComponentPromise: Promise<Type<unknown>>;

  /** In a shared view there is no search of the whole workspace. */
  isShareMode = input<boolean>();

  protected environment = this.configService.configuration;
  protected user = this.store.selectSignal(selectCurrentUser);
  protected isAdmin = this.store.selectSignal(selectIsAdmin);
  protected userNotificationPath = this.store.selectSignal(selectUserSettingsNotificationPath);
  protected invitesPending = this.store.selectSignal(selectInvitesPending);
  protected forcedTheme = this.store.selectSignal(selectForcedTheme);

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        debounceTime(100),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.openGlobalSearchIfNeeded());
  }

  ngOnInit(): void {
    this.openGlobalSearchIfNeeded();
  }

  // Ctrl + K -> Global Search Dialog
  globalSearchTrigger(e: KeyboardEvent): void {
    const isModifierPressed = e.metaKey || e.ctrlKey;
    const isKPressed = e.key.toLowerCase() === 'k';
    if (isModifierPressed && isKPressed && this.dialog.openDialogs.length === 0) {
      e.preventDefault();
      e.stopPropagation();
      document.body.querySelectorAll('.cdk-overlay-backdrop').forEach((c: HTMLDivElement) => c.click());
      document.body.querySelectorAll('.cdk-overlay-container').forEach((c: HTMLDivElement) => c.click());
      this.openGlobalSearch();
    }
  }

  private openGlobalSearchIfNeeded() {
    if (this.dialog.openDialogs.length === 0 && (this.activeRoute.snapshot.queryParams.gq || this.activeRoute.snapshot.queryParams.tab)) {
      this.openGlobalSearch();
    }
  }

  logout() {
    this.loginService.clearLoginCache();
    this.store.dispatch(logout({}));
  }

  openWelcome(event: MouseEvent) {
    event.preventDefault();
    this.dialog.open(WelcomeMessageComponent, {data: {step: 2}, panelClass: 'dialog-md'});
  }

  openAppearance(event: MouseEvent) {
    event.preventDefault();
    this.dialog.open(AppearanceComponent);
  }

  openGlobalSearch() {
    if (!this.searchComponentPromise) {
      this.searchComponentPromise = import(
        '@common/dashboard-search/global-search-dialog/global-search-dialog.component'
        ).then(({GlobalSearchDialogComponent}) => GlobalSearchDialogComponent);
    }

    this.searchComponentPromise.then(component => {
      this.dialog.open(component, {
        panelClass: 'dialog-xl',
        enterAnimationDuration: 0
      });
    });
  }
}
