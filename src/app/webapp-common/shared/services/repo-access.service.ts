import {inject, Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {HTTP} from '~/app.constants';

// How a repository is reached (repo_access.resolve). No secret is ever part of it.
export interface RepoAccess {
  repository: string;
  state: 'public' | 'app' | 'token' | 'refused';
  // the name of the GitHub App, or the host of the token; empty for public and refused
  via: string;
  message: string;
}

@Injectable({providedIn: 'root'})
export class RepoAccessService {
  private api = inject(SmApiRequestsService);

  resolve(repositories: string[]): Observable<RepoAccess[]> {
    if (!repositories.length) {
      return of([]);
    }
    return this.api.post<{ repositories?: RepoAccess[] }>(`${HTTP.API_BASE_URL}/repo_access.resolve`, {repositories}, {})
      .pipe(
        map(response => response?.repositories ?? []),
        // a failed check shows no badge; the page itself still works
        catchError(() => of([] as RepoAccess[])),
      );
  }
}
