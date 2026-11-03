import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {ApiAuthService} from '~/business-logic/api-services/auth.service';
import * as authActions from '../actions/common-auth.actions';
import {setCredentialLabel, setSignedUrls} from '../actions/common-auth.actions';
import {requestFailed} from '../actions/http.actions';
import {activeLoader, addMessage, deactivateLoader, setServerError} from '../actions/layout.actions';
import {catchError, filter, finalize, map, mergeMap, switchMap, throttleTime} from 'rxjs/operators';
import {AuthGetCredentialsResponse} from '~/business-logic/model/auth/authGetCredentialsResponse';
import {Store} from '@ngrx/store';
import {selectCurrentUser} from '../reducers/users-reducer';
import {GetCurrentUserResponseUserObject} from '~/business-logic/model/users/getCurrentUserResponseUserObject';
import {AdminService} from '~/shared/services/admin.service';
import {
  selectDontShowAgainForBucketEndpoint,
  selectS3BucketCredentialsBucketCredentials,
  selectSignedUrl,
  selectSignedUrls
} from '@common/core/reducers/common-auth-reducer';
import {EMPTY, forkJoin, of} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {isGoogleCloudUrl, SignResponse} from '@common/settings/admin/base-admin-utils';
import {selectRouterQueryParams} from '@common/core/reducers/router-reducer';
import {concatLatestFrom} from '@ngrx/operators';
import {selectCompanyPreSignServices, selectExtraCredentials} from '~/core/reducers/auth.reducers';
import {ErrorService} from '@common/shared/services/error.service';
import {MESSAGES_SEVERITY} from '@common/constants';

@Injectable()
export class CommonAuthEffects {
  private actions = inject(Actions);
  private credentialsApi = inject(ApiAuthService);
  private store = inject(Store);
  private adminService = inject(AdminService);
  private errorService = inject(ErrorService);
  private matDialog = inject(MatDialog);
  private openPopup: Record<string, boolean> = {};

  activeLoader = createEffect(() => this.actions.pipe(
    ofType(authActions.getAllCredentials, authActions.createCredential),
    filter(action => !(action as any).autorefresh),
    map(action => activeLoader(action.type))
  ));

  refresh = createEffect(() => this.actions.pipe(
    ofType(authActions.refreshS3Credential, authActions.getSignedUrl),
    map(() => {
      const state = JSON.parse(window.localStorage.getItem('_saved_state_'));
      return authActions.setS3Credentials({bucketCredentials: state?.auth?.s3BucketCredentials?.bucketCredentials});
    })
  ));

  signUrl = createEffect(() => this.actions.pipe(
    ofType(authActions.getSignedUrl),
    switchMap(action => this.store.select(selectExtraCredentials)
      .pipe(
        filter(c => c !== null),
        map(() => action)
      )
    ),
    filter(action => !!action.url),
    mergeMap(action =>
      of(action).pipe(
        concatLatestFrom(() =>
          this.store.select(selectSignedUrl(action.url))
        ),
        switchMap(([, signedUrl]) =>
          (!signedUrl?.expires || signedUrl.expires < (new Date()).getTime() ||
            (action.config?.error && isGoogleCloudUrl(action.url) && !signedUrl.signed.includes('X-Amz-Signature'))
          ) ?
            this.adminService.signUrlIfNeeded(action.url, action.config, signedUrl) : of({type: 'none'})
        ),
        filter(res => !!res),
        switchMap((res: SignResponse) => {
            switch (res.type) {
              case 'popup':
                return [addMessage(MESSAGES_SEVERITY.ERROR, 'The server cannot sign links for this storage bucket.')];
              case 'sign':
                return [authActions.setSignedUrl({url: action.url, signed: res.signed, expires: res.expires})];
              default:
                return EMPTY;
            }
          }
        )
      )
    )
  ));

  signUrls = createEffect(() => {
    return this.actions.pipe(
      ofType(authActions.signUrls),
      filter(action => action.sign.length > 0),
      switchMap(action => this.store.select(selectExtraCredentials)
        .pipe(
          filter(c => c !== null),
          map(() => action)
        )
      ),
      concatLatestFrom(() => [
        this.store.select(selectSignedUrls)
      ]),
      mergeMap(([action, prevSigns]) =>
        forkJoin(action.sign.map(req =>
          of(action).pipe(
            concatLatestFrom(() => [
              this.store.select(selectSignedUrl(req.url)),
              this.store.select(selectCompanyPreSignServices)
            ]),
            switchMap(([, signedUrl, preSignService]) => (!signedUrl?.expires || signedUrl.expires < (new Date()).getTime() ||
              (req.config?.error && isGoogleCloudUrl(req.url) && !signedUrl.signed.includes('X-Amz-Signature')) ||
              preSignService.length > 0
            ) ? this.adminService.signUrlIfNeeded(req.url, req.config, prevSigns[req.url]) : of({type: 'none'})),
            map(res => ({res, orgUrl: req.url}))
          )
        )).pipe(
          switchMap((responses) => {
            const groups = responses
              .filter(res => !!res.res)
              .reduce((acc, res) => {
                if (Object.hasOwn(acc, res.res.type)) {
                  acc[res.res.type].push(res);
                } else {
                  acc[res.res.type] = [res];
                }
                return acc;
              }, {});
            return Object.keys(groups).map(type => {
              switch (type) {
                case 'popup':
                  return [addMessage(MESSAGES_SEVERITY.ERROR, 'The server cannot sign links for this storage bucket.')];
                case 'sign':
                  return setSignedUrls({
                    signed: groups['sign'].map((res: { res: SignResponse, orgUrl: string }) =>
                      ({url: res.orgUrl, signed: res.res.signed, expires: res.res.expires}))
                  });
                default:
                  return null;
              }
            })
              .filter(a => !!a)
              .flat();
          })
        )
      )
    );
  });
}
