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

// A code repository a run uses (see apiserver bll/repositories): its owner (the run's user), the GitHub App attached to it
// (an id, never a secret), and when a run last used it.
export interface CodeRepository {
  id: string;
  ref: string;
  owner: string;
  credential: string | null;
  created: string | null;
  last_used: string | null;
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

  // The code repositories runs use, the user's own (all of them for an admin).
  repositories(): Observable<CodeRepository[]> {
    return this.api.post<{ repositories?: CodeRepository[] }>(`${HTTP.API_BASE_URL}/repositories.get_all`, {}, {})
      .pipe(map(response => response?.repositories ?? []));
  }

  // Lists a repository before any run has used it, owned by the caller, with the GitHub App it is read with (none: public).
  addRepository(repository: string, credential?: string): Observable<CodeRepository> {
    return this.api.post<{ repository: CodeRepository }>(`${HTTP.API_BASE_URL}/repositories.add`,
      {repository, credential: credential || undefined}, {}).pipe(map(response => response.repository));
  }

  // Attaches the GitHub App chosen to a repository, by its address. Only its owner or an admin may.
  setRepositoryCredential(repository: string, credential: string): Observable<CodeRepository> {
    return this.api.post<{ repository: CodeRepository }>(`${HTTP.API_BASE_URL}/repositories.set_credential`,
      {repository, credential}, {}).pipe(map(response => response.repository));
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
