import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {catchError, filter, first, map, retry, tap} from 'rxjs/operators';
import {HTTP} from '~/app.constants';
import {BehaviorSubject, combineLatest, Observable, of, timer} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '../ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {LoginModeResponse} from '~/business-logic/model/LoginModeResponse';
import {ApiLoginService} from '~/business-logic/api-services/login.service';
import {ConfigurationService} from './configuration.service';
import {USER_PREFERENCES_KEY, UserPreferences} from '@common/user-preferences';
import {fetchCurrentUser} from '@common/core/actions/users.actions';
import {Store} from '@ngrx/store';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {selectDarkTheme} from '@common/core/reducers/view.reducer';
import {TIME_IN_MILLI} from '@common/shared/utils/time-util';
import {resetCurrentUser} from '~/core/actions/users.action';
import {selectUserInitialized} from '@common/core/reducers/users-reducer';

export type LoginMode = 'ssoOnly' | 'error';

export const loginModes = {
  error: 'error' as LoginMode,
  ssoOnly: 'ssoOnly' as LoginMode,
};

/**
 * Sign-in is by the identity provider only. The browser is sent to the server's identity-provider
 * sign-in, and comes back with a session cookie; the app holds no credential of its own.
 */
@Injectable({
  providedIn: 'root'
})
export class BaseLoginService {
  protected httpClient = inject(HttpClient);
  public loginApi = inject(ApiLoginService);
  protected dialog = inject(MatDialog);
  protected configService = inject(ConfigurationService);
  protected store = inject(Store);
  protected userPreferences = inject(UserPreferences);

  loginMode = signal<LoginMode>(null);
  protected basePath = HTTP.API_BASE_URL;
  private _loginModeTTL = 0;
  private _loginMode: LoginMode;
  protected environment = this.configService.configuration;
  protected darkTheme = this.store.selectSignal(selectDarkTheme);
  private state = computed(() => ({
    env: this.environment(),
    signupMode: signal(!!this.environment().communityServer && !window.localStorage.getItem(USER_PREFERENCES_KEY.firstLogin))
  }));

  get signupMode() {
    return this.state().signupMode;
  }

  protected _authenticated: boolean;
  protected _authenticated$ = new BehaviorSubject<boolean>(false);
  get authenticated(): boolean {
    return this._authenticated;
  }

  set authenticated(isAuth) {
    this._authenticated = isAuth;
    this._authenticated$.next(isAuth);
  }

  get authenticated$(): Observable<boolean> {
    return this._authenticated$;
  }

  initCredentials() {
    return this.getLoginMode().pipe(
      retry({count: 3, delay: (err, count) => timer(500 * count)}),
      catchError(err => {
        this.openServerError();
        throw err;
      }),
      map(() => null)
    );
  }

  // The session cookie is the only credential; the browser sends it with each request.
  getHeaders(): HttpHeaders {
    return new HttpHeaders();
  }

  getLoginMode(force = false): Observable<LoginMode> {
    if (this._loginMode !== undefined && !force && this._loginModeTTL > new Date().getTime()) {
      return of(this._loginMode);
    } else {
      return this.getLoginSupportedModes()
        .pipe(
          tap((res: LoginModeResponse) => {
            this.authenticated = res.authenticated;
            this._loginMode = this.calcLoginMode();
            this._loginModeTTL = new Date().getTime() + TIME_IN_MILLI.ONE_MIN * 10;
          }),
          map(() => {
            this.loginMode.set(this._loginMode);
            return this._loginMode;
          }),
          catchError(() => {
            this._loginMode = loginModes.error;
            this.loginMode.set(this._loginMode);
            return of(this._loginMode);
          }),
        );
    }
  }

  protected calcLoginMode(): LoginMode {
    return loginModes.ssoOnly;
  }

  public getLoginSupportedModes(): Observable<LoginModeResponse> {
    return this.loginApi.loginSupportedModes({});
  }

  private openServerError() {
    this.setLogo();
    const body = this.environment().serverDownMessage;

    const confirmDialogRef = this.dialog.open(ConfirmDialogComponent, {
      disableClose: true,
      data: {
        width: 440,
        title: 'Server Unavailable',
        body,
        yes: 'Reload',
        iconClass: 'al-ico-alert-outline',
        centerText: true
      } as ConfirmDialogConfig
    });
    confirmDialogRef.afterClosed().subscribe(() => {
      window.location.reload();
    });
  }

  private setLogo() {
    // Mocking application header
    const imgElement = new Image();
    imgElement.setAttribute('src', this.darkTheme() ? this.environment().branding.logo : this.environment().branding.logo.replace('-white', ''));
    imgElement.setAttribute('style', 'width: 100%; height: 64px; padding: 15px;');
    document.body.appendChild(imgElement);
  }

  clearLoginCache() {
    this._loginMode = undefined;
  }

  /** Sends the browser to the identity provider; the server sets the session cookie and returns here. */
  redirectToIdp() {
    window.location.href = `${this.basePath}/login.idp_start`;
  }

  loginFlow(): Observable<string> {
    if (this.authenticated === false) {
      this.redirectToIdp();
      return of(null);
    }
    this.store.dispatch(fetchCurrentUser());
    return combineLatest([
      this.userPreferences.loadPreferences(),
      this.store.select(selectUserInitialized).pipe(filter(initialized => initialized), first())
    ]).pipe(
      catchError((err) => {
        if (err?.status === 401) {
          this.redirectToIdp();
        }
        return of(null);
      }),
      map(() => null)
    );
  }

  logout() {
    this._loginMode = undefined;
    this.authenticated = false;
    this.store.dispatch(resetCurrentUser());
    this.dialog.closeAll();
    // Ends the CairnML session; the identity provider decides whether the person must sign in again.
    this.httpClient.post(`${this.basePath}/login.logout`, null, {withCredentials: true}).subscribe({
      complete: () => this.redirectToIdp(),
      error: () => this.redirectToIdp(),
    });
  }
}
