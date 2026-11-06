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
  add(kind: 'repo' | 'registry', url: string, visibility: DatasetVisibility, project?: string): Observable<AccessDataset> {
    return this.api.post<{ dataset: AccessDataset }>(`${HTTP.API_BASE_URL}/datasets.add`,
      {kind, url, visibility, project}, {}).pipe(map(response => response.dataset));
  }

  setVisibility(id: string, visibility: DatasetVisibility, projects: string[] = []): Observable<AccessDataset> {
    return this.api.post<{ dataset: AccessDataset }>(`${HTTP.API_BASE_URL}/datasets.set_visibility`,
      {id, visibility, projects}, {}).pipe(map(response => response.dataset));
  }

  allocate(id: string, project: string): Observable<AccessDataset> {
    return this.api.post<{ dataset: AccessDataset }>(`${HTTP.API_BASE_URL}/datasets.allocate`, {id, project}, {})
      .pipe(map(response => response.dataset));
  }

  remove(id: string): Observable<unknown> {
    return this.api.post(`${HTTP.API_BASE_URL}/datasets.delete`, {id}, {});
  }
}
