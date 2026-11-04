import {inject, Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {HTTP} from '~/app.constants';
import {MESSAGES_SEVERITY} from '@common/constants';
import {addMessage} from '@common/core/actions/layout.actions';

export interface GithubAppStatus {
  state: 'ok' | 'refused' | 'unreachable' | 'not_configured' | 'unknown';
  message: string;
  checked_at?: string;
}

// The GitHub App status as a banner after sign-in (github.status). Every user sees it: a working App says what it
// registered and clears itself; a refused or unreachable App stays until it is closed, and says to contact an admin.
@Injectable({providedIn: 'root'})
export class GithubAppStatusService {
  private api = inject(SmApiRequestsService);
  private store = inject(Store);

  announce(): void {
    this.status().subscribe(status => {
      if (!status || status.state === 'unknown') {
        return;
      }
      const severity = status.state === 'ok' ? MESSAGES_SEVERITY.SUCCESS : MESSAGES_SEVERITY.ERROR;
      this.store.dispatch(addMessage(severity, status.message));
    });
  }

  status(): Observable<GithubAppStatus | null> {
    return this.api.post<{ status?: GithubAppStatus }>(`${HTTP.API_BASE_URL}/github.status`, {}, {}).pipe(
      map(response => response?.status ?? null),
      // a failed request shows no banner: the page itself still works
      catchError(() => of(null)),
    );
  }
}
