import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {HTTP} from '~/app.constants';

// Who may see a dataset: the owner only ('user'), the projects it is shared with ('projects'), or every user ('Public').
export type DatasetVisibility = 'user' | 'projects' | 'Public';

export const DATASET_VISIBILITY_LABELS: Record<DatasetVisibility, string> = {
  user: 'User only',
  projects: 'Projects',
  Public: 'Public',
};

// The share of a dataset with one project, from its share record: the level it gives, the id that access.unshare takes,
// and whether a run made it (inherited) rather than a member.
export interface AccessDatasetProjectShare {
  project: string;
  level: 'read' | 'read_write' | 'collaborator';
  share_id: string;
  inherited: boolean;
}

// A dataset as the server lists it for the signed-in user. Never a secret: credential is the id of the access that
// reads it. state is 'no_access' when that access is gone; state_message then names the dataset.
export interface AccessDataset {
  id: string;
  kind: 'repo' | 'registry' | 'registry_entry';
  ref: string;
  name: string;
  owner: string;
  visibility: DatasetVisibility;
  projects: string[];
  project_shares: AccessDatasetProjectShare[];
  credential: string | null;
  state: 'ok' | 'no_access';
  state_message: string;
  source: string;
  link: string;
  added: string | null;
  last_checked: string | null;
}

// A credential the signed-in user may choose for a dataset: their own GitHub App or token, or the company's (see
// user_access.get_all). Never a secret.
export interface StoredCredential {
  id: string;
  name: string;
  type: string;
  scope: 'user' | 'company';
  owner: string;
  valid_for: string;
  state: string;
}

// How a binding reads its repository (apiserver bll/repositories.resolve): with the credential assigned to it, with "None
// needed", without a credential because the host allows it (anonymous), through the company's access (company, with a
// warning: assigning a credential is recommended), or not at all (unreachable). unknown: the host could not be asked.
export type BindingState = 'assigned' | 'none_needed' | 'anonymous' | 'company' | 'unknown' | 'unreachable';

export interface AssignableCredential {
  id: string;
  name: string;
  kind: 'app' | 'token';
  company: boolean;
}

// How one root project reads a repository: owned by the project's owner, found by the first user of it there.
export interface RepositoryBinding {
  id: string;
  project: string | null;
  project_name: string | null;
  owner: string;
  owner_name: string;
  discovered_by: string;
  discovered_by_name: string;
  credential: string | null;
  none_needed: boolean;
  state: BindingState;
  message: string;
  can_assign: boolean;
  assignable: AssignableCredential[];
  created: string | null;
  last_used: string | null;
}

// A code repository runs use (apiserver bll/repositories): one per repository whatever the spelling of its address, with
// a binding per project that uses it. anonymous: whether the host clones it without a credential (null: not known).
export interface CodeRepository {
  id: string;
  key: string;
  host: string;
  path: string;
  url: string;
  anonymous: boolean | null;
  bindings: RepositoryBinding[];
}

// The datasets of the environment, and the changes a user may make to them (see apiserver bll/datasets).
@Injectable({providedIn: 'root'})
export class DatasetAccessService {
  private api = inject(SmApiRequestsService);

  visible(): Observable<AccessDataset[]> {
    return this.api.post<{ datasets?: AccessDataset[] }>(`${HTTP.API_BASE_URL}/datasets.visible`, {}, {})
      .pipe(map(response => response?.datasets ?? []));
  }

  // Adds a repository (kind 'repo') or a registry (kind 'registry') without creating anything. The dataset is returned
  // even when it has no access: its state says so.
  // A repository is read with the credential given (an id from credentials()); with none it is public.
  add(kind: 'repo' | 'registry', url: string, visibility: DatasetVisibility, project?: string,
      credential?: string): Observable<AccessDataset> {
    return this.api.post<{ dataset: AccessDataset }>(`${HTTP.API_BASE_URL}/datasets.add`,
      {kind, url, visibility, project, credential: credential || undefined}, {}).pipe(map(response => response.dataset));
  }

  setVisibility(id: string, visibility: DatasetVisibility, projects: string[] = []): Observable<AccessDataset> {
    return this.api.post<{ dataset: AccessDataset }>(`${HTTP.API_BASE_URL}/datasets.set_visibility`,
      {id, visibility, projects}, {}).pipe(map(response => response.dataset));
  }

  allocate(id: string, project: string): Observable<AccessDataset> {
    return this.api.post<{ dataset: AccessDataset }>(`${HTTP.API_BASE_URL}/datasets.allocate`, {id, project}, {})
      .pipe(map(response => response.dataset));
  }

  // The code repositories runs use, the user's own (all of them for an admin); with a project, only that project's.
  repositories(project?: string): Observable<CodeRepository[]> {
    return this.api.post<{ repositories?: CodeRepository[] }>(`${HTTP.API_BASE_URL}/repositories.get_all`, {project: project || undefined}, {})
      .pipe(map(response => response?.repositories ?? []));
  }

  // Lists a repository before any run has used it, for a project (the user's own scope without one).
  addRepository(repository: string, project?: string): Observable<string> {
    return this.api.post<{ binding: string }>(`${HTTP.API_BASE_URL}/repositories.add`,
      {repository, project: project || undefined}, {}).pipe(map(response => response.binding));
  }

  // Assigns a credential to a binding, "None needed", or (neither) clears the assignment.
  setBindingCredential(binding: string, credential: string | null, noneNeeded = false): Observable<string> {
    return this.api.post<{ binding: string }>(`${HTTP.API_BASE_URL}/repositories.set_credential`,
      {binding, credential: credential || undefined, none_needed: noneNeeded || undefined}, {})
      .pipe(map(response => response.binding));
  }

  // The credentials the signed-in user may choose for a dataset: their own, and the company's.
  credentials(): Observable<StoredCredential[]> {
    return this.api.post<{ credentials?: StoredCredential[] }>(`${HTTP.API_BASE_URL}/user_access.get_all`, {}, {})
      .pipe(map(response => response?.credentials ?? []));
  }

  // Sets the credential a repository dataset is read with, by its repository address. Only the owner or an admin may.
  setCredential(repository: string, credential: string): Observable<AccessDataset> {
    return this.api.post<{ dataset: AccessDataset }>(`${HTTP.API_BASE_URL}/datasets.set_credential`,
      {repository, credential}, {}).pipe(map(response => response.dataset));
  }

  remove(id: string): Observable<unknown> {
    return this.api.post(`${HTTP.API_BASE_URL}/datasets.delete`, {id}, {});
  }
}
