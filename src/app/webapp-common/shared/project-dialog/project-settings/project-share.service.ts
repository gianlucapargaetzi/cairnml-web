import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {HTTP} from '~/app.constants';
import {ShareLevel} from '@common/shared/ui-components/inputs/share-control/share-control.component';

// A dataset usable within a project: public (scope 'public', never removable here) or shared with the project
// (scope 'project'). share_id is the share a removal takes through access.unshare.
export interface ProjectUsableDataset {
  id: string;
  name: string;
  owner: string;
  owner_name: string;
  visibility: string;
  scope: 'public' | 'project';
  removable: boolean;
  level: ShareLevel;
  inherited: boolean;
  share_id: string | null;
  repository: string;
}

// A credential usable within a project, with its host and path. A credential brought in by a dataset is not removable.
export interface ProjectUsableCredential {
  id: string;
  name: string;
  host: string;
  path: string;
  owner: string;
  owner_name: string;
  scope: 'public' | 'project';
  removable: boolean;
  level: 'read' | 'collaborator';
  inherited: boolean;
  share_id: string | null;
}

export interface ProjectUsable {
  // true when the caller may add and remove the project's shares: its owner, its collaborators and company admins
  can_manage: boolean;
  datasets: ProjectUsableDataset[];
  credentials: ProjectUsableCredential[];
}

// Changes a project's datasets and credentials, and removes shares of a queue, dataset, registry or credential with a
// project (apiserver services/access). The server finds the share by its id and refuses the revoke when the signed-in
// user may not make it.
@Injectable({providedIn: 'root'})
export class ProjectShareService {
  private api = inject(SmApiRequestsService);

  // The datasets and credentials the project can use. Read for the members of the project and company admins.
  usable(project: string): Observable<ProjectUsable> {
    return this.api.post<ProjectUsable>(`${HTTP.API_BASE_URL}/projects.usable`, {project}, {})
      .pipe(map(res => ({can_manage: res?.can_manage === true, datasets: res?.datasets ?? [], credentials: res?.credentials ?? []})));
  }

  unshare(shareId: string): Observable<unknown> {
    return this.api.post(`${HTTP.API_BASE_URL}/access.unshare`, {share_id: shareId}, {});
  }

  // Adds a dataset to a project.
  allocateDataset(id: string, project: string): Observable<unknown> {
    return this.api.post(`${HTTP.API_BASE_URL}/datasets.allocate`, {id, project}, {});
  }

  // Shares a credential with a project at read level.
  shareCredential(id: string, project: string): Observable<unknown> {
    return this.api.post(`${HTTP.API_BASE_URL}/access.share`, {
      resource_type: 'credential',
      resource_id: id,
      scope: 'projects',
      project,
      level: 'read',
    }, {});
  }
}
