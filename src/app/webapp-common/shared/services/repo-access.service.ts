import {inject, Injectable} from '@angular/core';
import {Observable, of, Subject} from 'rxjs';
import {catchError, map, startWith, switchMap} from 'rxjs/operators';
import {ApiRepositoriesService} from '~/business-logic/api-services/repositories.service';

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
  private repositories = inject(ApiRepositoriesService);
  private credentialChanged = new Subject<void>();

  // Tell everything that shows how the signed-in user reads a repository that a credential was assigned or removed.
  notifyCredentialChanged(): void {
    this.credentialChanged.next();
  }

  // How the signed-in user reads the repository that `repository$` currently names: resolved for each repository, and
  // again whenever a credential changes, so that a badge turns green as soon as the credential that fixes it is assigned.
  // The project is read when each request is made. An empty repository has no access state (null). The returned stream
  // holds no subscription of its own: unsubscribing from it ends the listening for credential changes too.
  watch(repository$: Observable<string>, project: () => string | null | undefined): Observable<RepoAccess | null> {
    return repository$.pipe(
      switchMap(repository => repository ?
        this.credentialChanged.pipe(
          startWith(undefined),
          switchMap(() => this.resolve([repository], project()).pipe(map(results => results[0] ?? null))),
        ) :
        of(null)),
    );
  }

  // How the signed-in user reads each repository in the project.
  resolve(repositories: string[], project?: string | null): Observable<RepoAccess[]> {
    if (!repositories.length) {
      return of([]);
    }
    const body = project ? {refs: repositories, project} : {refs: repositories};
    return this.repositories.repositoriesResolve(body)
      .pipe(
        map(response => response?.repositories ?? []),
        // a failed check shows no badge; the page itself still works
        catchError(error => {
          // eslint-disable-next-line no-console
          console.warn('repositories.resolve failed; the repositories show no access state', error);
          return of([] as RepoAccess[]);
        }),
      );
  }

  // What the repositories of these tasks need before they are dispatched: the rows to warn about have `ask` set.
  requirement(tasks: string[]): Observable<RepoAccess[]> {
    if (!tasks.length) {
      return of([]);
    }
    return this.repositories.repositoriesRequirement({tasks})
      .pipe(
        map(response => response?.repositories ?? []),
        // a failed check never stops a dispatch: the server checks again when the task is enqueued
        catchError(error => {
          // eslint-disable-next-line no-console
          console.warn('repositories.requirement failed; no dispatch warning is shown', error);
          return of([] as RepoAccess[]);
        }),
      );
  }
}
