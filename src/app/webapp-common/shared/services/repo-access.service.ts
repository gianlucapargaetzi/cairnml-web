import {inject, Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {HTTP} from '~/app.constants';

// How a project reads a repository (repositories.resolve / requirement). No secret is ever part of it. `ask`: the web app
// warns before a dispatch, because nothing is assigned and the company's access does not reach the repository.
export interface RepoAccess {
  repository: string;
  url: string;
  // the repository's id (what repositories.assign takes), when the server has a record of it
  id: string | null;
  project: string | null;
  project_name?: string | null;
  state: 'assigned' | 'none_needed' | 'anonymous' | 'company' | 'unknown' | 'unreachable';
  // the name of the assigned credential; empty otherwise
  via: string;
  message: string;
  can_assign: boolean;
  ask: boolean;
  // the read is a fallback the project should look at: the runner's own credential, or the company's
  warning?: boolean;
  // requirement only: the tasks that use it, the credentials the caller may assign, and whether the host clones it anonymously
  tasks?: string[];
  kinds?: ('code' | 'dataset' | 'registry')[];
  assignable?: {id: string; name: string; kind: 'app' | 'token'; company: boolean}[];
  anonymous?: boolean | null;
}

@Injectable({providedIn: 'root'})
export class RepoAccessService {
  private api = inject(SmApiRequestsService);

  // How the signed-in user reads each repository in the project.
  resolve(repositories: string[], project?: string | null): Observable<RepoAccess[]> {
    if (!repositories.length) {
      return of([]);
    }
    const body = project ? {repositories, project} : {repositories};
    return this.api.post<{ repositories?: RepoAccess[] }>(`${HTTP.API_BASE_URL}/repositories.resolve`, body, {})
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
    return this.api.post<{ repositories?: RepoAccess[] }>(`${HTTP.API_BASE_URL}/repositories.requirement`, {tasks}, {})
      .pipe(
        map(response => response?.repositories ?? []),
        // a failed check never stops a dispatch: the server checks again when the task is enqueued
        catchError(() => of([] as RepoAccess[])),
      );
  }
}
