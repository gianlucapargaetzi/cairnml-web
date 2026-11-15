import {effect, inject, Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {fromFetch} from 'rxjs/fetch';
import {catchError} from 'rxjs/operators';
import {Observable, of} from 'rxjs';
import {datachunkBrowserUrl, isDatachunkUrl} from '~/shared/utils/url';
import {selectRevokeSucceed} from '../../core/reducers/common-auth-reducer';
import {getAllCredentials, showLocalFilePopUp} from '../../core/actions/common-auth.actions';
import {ConfigurationService} from '../../shared/services/configuration.service';
import {getBucketAndKeyFromSrc, isGoogleCloudUrl, SignResponse} from '@common/settings/admin/base-admin-utils';
import {selectCompanyPreSignServices} from '~/core/reducers/auth.reducers';

const LOCAL_SERVER_PORT = 27878;


@Injectable()
export class BaseAdminService {
  protected store = inject(Store);
  protected confService = inject(ConfigurationService);

  private revokeSucceed = this.store.selectSignal(selectRevokeSucceed);
  protected preSignServices = this.store.selectSignal(selectCompanyPreSignServices);
  private localServerWorking = false;

  constructor() {
    effect(() => {
      if (this.revokeSucceed()) {
        this.getAllCredentials();
      }
    });
  }

  showLocalFilePopUp(url) {
    this.store.dispatch(showLocalFilePopUp({url}));
  }

  // Storage buckets are not signed in the browser: the server signs links it can sign. A bucket link that cannot be
  // signed here is reported to the user (popup), and Google Cloud public links are signed by their address.
  signUrlIfNeeded(
    url: string,
    config?: { skipLocalFile?: boolean },
    previousSignedUrl?: { signed: string; expires: number }
  ): Observable<SignResponse> {
    config = {...{skipLocalFile: true}, ...config};

    if (isDatachunkUrl(url)) {
      return of({type: 'sign', signed: datachunkBrowserUrl(url), expires: Number.MAX_VALUE});
    }

    if (this.isLocalFile(url) && !config.skipLocalFile) {
      this.checkLocalServerRunning(url);
      return of({type: 'sign', signed: this.redirectToLocalServer(url), expires: Number.MAX_VALUE});
    }

    if (this.preSignServices().length > 0) {
      const signed = this.redirectToSignServer(url);
      if (signed !== url) {
        return of({type: 'sign', signed, expires: Number.MAX_VALUE});
      }
    }

    const bucketKeyEndpoint = url && getBucketAndKeyFromSrc(url);
    if (bucketKeyEndpoint) {
      if (this.isAzureUrl(url)) {
        return of({type: 'popup', bucket: bucketKeyEndpoint, provider: 'azure'});
      }
      if (isGoogleCloudUrl(url) && !previousSignedUrl?.signed) {
        return of({type: 'sign', signed: this.signGoogleCloudUrl(url), expires: Number.MAX_VALUE});
      }
      delete bucketKeyEndpoint.Key;
      return of({type: 'popup', bucket: bucketKeyEndpoint, provider: isGoogleCloudUrl(url) ? 'gcs' : 's3'});
    }
    return of({type: 'sign', signed: url, expires: Number.MAX_VALUE});
  }

  public getAllCredentials() {
    this.store.dispatch(getAllCredentials({}));
  }

  // Relies on a browser extension that injects patch_local_link into window to read local files.
  redirectToLocalServer(url: string): string {
    return `http://localhost:${LOCAL_SERVER_PORT}${url.replace('file://', '/')}`;
  }

  redirectToSignServer(url: string): string {
    return url;
  }

  isLocalFile(url: string): boolean {
    return url && (url.startsWith('/') || url.startsWith('file://') ||
      url.startsWith(':\\', 1) || url.startsWith('\\\\'));
  }

  checkLocalServerRunning(url: string) {
    if (this.localServerWorking) {
      return;
    }

    fromFetch(`http://localhost:${LOCAL_SERVER_PORT}`, {mode: 'no-cors'})
      .pipe(catchError(() => {
        this.showLocalFilePopUp(url);
        return [];
      }))
      .subscribe(() =>
        this.localServerWorking = true);
  }

  signGoogleCloudUrl(url: string): string {
    let result = url.slice(5);
    if (result.search(/[ !"#$&'()*+,;<=>?@\[\\\]^]/) > -1) {
      result = result.split('/').map(part => encodeURIComponent(part)).join('/');
    }
    return 'https://storage.cloud.google.com/' + result;
  }

  isAzureUrl(url: string) {
    return url.startsWith('azure://');
  }
}
