import {inject, Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {HTTP} from '~/app.constants';

// How a project reads a repository (repo_access.resolve / requirement). No secret is ever part of it. `ask`: the web app
// warns before a dispatch, because nothing is assigned and the company's access does not reach the repository.
export interface RepoAccess {
  repository: string;
  url: string;
  binding: string | null;
  project: string | null;
  state: 'assigned' | 'none_needed' | 'anonymous' | 'company' | 'unknown' | 'unreachable';
  // the name of the assigned credential; empty otherwise
  via: string;
  message: string;
  can_assign: boolean;
  ask: boolean;
  // requirement only: the tasks that use it, the credentials the caller may assign, and whether the host clones it anonymously
  tasks?: string[];
  assignable?: {id: string; name: string; kind: 'app' | 'token'; company: boolean}[];
  anonymous?: boolean | null;
}

@Injectable({providedIn: 'root'})
export class RepoAccessService {
  private api = inject(SmApiRequestsService);

  // The access for each repository, for the signed-in user; the accesses shared with the project count too.
  resolve(repositories: string[], project?: string | null): Observable<RepoAccess[]> {
    if (!repositories.length) {
      return of([]);
    }
    const body = project ? {repositories, project} : {repositories};
    return this.api.post<{ repositories?: RepoAccess[] }>(`${HTTP.API_BASE_URL}/repo_access.resolve`, body, {})
      .pipe(
        map(response => response?.repositories ?? []),
        // a failed check shows no badge; the page itself still works
        catchError(() => of([] as RepoAccess[])),
      );
  }

  // What the repositories of these tasks need before they are dispatched: the rows to warn about have `ask` set.
  requirement(tasks: string[]): Observable<RepoAccess[]> {
    if (!tasks.length) {
      return of([]);
    }
    return this.api.post<{ repositories?: RepoAccess[] }>(`${HTTP.API_BASE_URL}/repo_access.requirement`, {tasks}, {})
      .pipe(
        map(response => response?.repositories ?? []),
        // a failed check never stops a dispatch: the server checks again when the task is enqueued
        catchError(() => of([] as RepoAccess[])),
      );
  }
}
