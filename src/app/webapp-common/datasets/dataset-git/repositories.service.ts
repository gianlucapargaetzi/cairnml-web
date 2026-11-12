import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {HTTP} from '~/app.constants';

// Repositories: code, datasets and registries of datasets are one kind of record (apiserver bll/repositories). A credential
// belongs to a user, never to a project: an assignment says how one user reads one repository.
export type RepoRole = 'code' | 'dataset' | 'registry';
export const REPO_ROLE_LABELS: Record<RepoRole, string> = {code: 'Code', dataset: 'Dataset', registry: 'Registry'};

// How a repository is read for the signed-in user: with a credential assigned, with "None needed", without a credential because
// the host allows it (anonymous), through the company's access (company, with a warning: assigning a credential is
// recommended), or not at all (unreachable). unknown: the host could not be asked.
export type ReadState = 'assigned' | 'none_needed' | 'anonymous' | 'company' | 'unknown' | 'unreachable';

// One assignment: how one user reads the repository. The signed-in user's own can be changed (can_edit); the others' are shown
// read-only. used_in: the listed projects it reads for (as the project's owner, or as a fallback).
export interface RepoAssignment {
  id: string;
  user: string;
  user_name: string;
  mine: boolean;
  credential: string | null;
  credential_name: string;
  company: boolean;
  none_needed: boolean;
  // whether the row's way of reading works: the open lock, or the closed one. A row without a credential reads without one
  // (a public repository: the open lock); one the host refuses is the closed lock
  readable: boolean;
  can_edit: boolean;
  // the projects this row reads for; member: the user may take the repository out of that project
  used_in: { project: string; project_name: string | null; as: 'owner' | 'fallback'; member: boolean; inherited: boolean }[];
  last_used: string | null;
}

export interface RepoEntry {
  id: string;
  name: string;
  reference: string;
  source: string;
  link: string;
}

export interface RepoCredentialChoice {
  id: string;
  name: string;
  kind: 'app' | 'token';
  company: boolean;
}

// A repository as the server lists it for the signed-in user. Never a secret.
export interface Repo {
  id: string;
  key: string;
  host: string;
  path: string;
  url: string;
  name: string;
  reference: string;
  roles: RepoRole[];
  owner: string;
  owner_name: string;
  // owned by the admin and visible to every user; otherwise owned by a user and passed on through projects
  shared: boolean;
  // for the signed-in user: shared (the company's), own (listed by them) or inherited (came with a project)
  relation: 'shared' | 'own' | 'inherited';
  state: 'ok' | 'no_access';
  state_message: string;
  anonymous: boolean | null;
  added: string | null;
  last_used: string | null;
  last_checked: string | null;
  projects: { project: string; project_name: string | null; share_id: string; inherited: boolean; member: boolean }[];
  assignments: RepoAssignment[];
  access: { state: ReadState; message: string; warning: boolean; readable: boolean | null };
  can_delete: boolean;
  // why it cannot be deleted (a project depends on it, or it is shared); null when it can be
  delete_blocked: string | null;
  can_share: boolean;
  can_assign: boolean;
  // what the user may assign: their own credentials and the company's (the company's only, for a shared repository)
  credentials: RepoCredentialChoice[];
  entries?: RepoEntry[];
}

// A run that used a repository, as the Runs tab lists it.
export interface RepoRun {
  id: string;
  name: string;
  status: string;
  project: string;
  project_name: string;
  user: string;
  user_name: string;
  created: string | null;
  as: RepoRole;
}

// A credential the signed-in user may use (user_access.get_all). Never a secret.
export interface StoredCredential {
  id: string;
  name: string;
  type: string;
  scope: 'user' | 'company';
  owner: string;
  valid_for: string;
  state: string;
}

@Injectable({providedIn: 'root'})
export class RepositoriesService {
  private api = inject(SmApiRequestsService);

  private post<T>(action: string, body: object): Observable<T> {
    return this.api.post<T>(`${HTTP.API_BASE_URL}/repositories.${action}`, body, {});
  }

  // The repositories the user sees; with a project, only those listed in it.
  list(project?: string): Observable<Repo[]> {
    return this.post<{ repositories?: Repo[] }>('get_all', {project: project || undefined}).pipe(map(r => r?.repositories ?? []));
  }

  add(url: string, role: RepoRole, options: { shared?: boolean; project?: string; credential?: string; noneNeeded?: boolean } = {}): Observable<Repo> {
    return this.post<{ repository: Repo }>('add', {
      url, role, shared: options.shared || undefined, project: options.project || undefined,
      credential: options.credential || undefined, none_needed: options.noneNeeded || undefined,
    }).pipe(map(r => r.repository));
  }

  delete(id: string): Observable<unknown> {
    return this.post('delete', {id});
  }

  // Makes a repository shared (its owner or the admin; ownership moves to the admin) or non-shared (the admin). To share, the
  // company credential that reads it, or "None needed" for a public repository, is required; the server verifies it first.
  setShared(id: string, shared: boolean, credential?: string, noneNeeded = false): Observable<Repo> {
    return this.post<{ repository: Repo }>('set_shared', {
      id, shared, credential: credential || undefined, none_needed: noneNeeded || undefined,
    }).pipe(map(r => r.repository));
  }

  // Whether the company credential (or "None needed") reads the repository, so that it may be shared.
  checkSharing(id: string, credential?: string, noneNeeded = false): Observable<{ ok: boolean; message: string }> {
    return this.post<{ ok: boolean; message: string }>('check_sharing', {
      id, credential: credential || undefined, none_needed: noneNeeded || undefined,
    });
  }

  link(id: string, project: string): Observable<Repo> {
    return this.post<{ repository: Repo }>('link', {id, project}).pipe(map(r => r.repository));
  }

  unlink(id: string, project: string): Observable<Repo> {
    return this.post<{ repository: Repo }>('unlink', {id, project}).pipe(map(r => r.repository));
  }

  // Sets the user's own assignment: a credential, "None needed", or (neither) clears it. Only the user's own is changed.
  assign(id: string, credential: string | null, noneNeeded = false): Observable<Repo> {
    return this.post<{ repository: Repo }>('assign', {id, credential: credential || undefined, none_needed: noneNeeded || undefined})
      .pipe(map(r => r.repository));
  }

  unassign(id: string): Observable<Repo> {
    return this.post<{ repository: Repo }>('unassign', {id}).pipe(map(r => r.repository));
  }

  // Looks at a repository again: the host's answer is renewed and the user's own assignment is tried.
  check(id: string): Observable<Repo> {
    return this.post<{ repository: Repo }>('check', {id}).pipe(map(r => r.repository));
  }

  // The runs that used a repository, newest first, in the projects the user sees.
  runs(id: string): Observable<RepoRun[]> {
    return this.post<{ runs?: RepoRun[] }>('get_runs', {id}).pipe(map(r => r?.runs ?? []));
  }

  // Reads a registry again. Returns the counts added, updated and removed.
  refresh(id: string): Observable<{ counts: { added: number; updated: number; removed: number }; repository: Repo }> {
    return this.post('refresh', {id});
  }

  // The credentials the signed-in user may use: their own, and the company's.
  credentials(): Observable<StoredCredential[]> {
    return this.api.post<{ credentials?: StoredCredential[] }>(`${HTTP.API_BASE_URL}/user_access.get_all`, {}, {})
      .pipe(map(response => response?.credentials ?? []));
  }
}
