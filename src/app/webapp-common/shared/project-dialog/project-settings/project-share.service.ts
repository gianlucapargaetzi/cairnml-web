import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {HTTP} from '~/app.constants';

// Revokes one share of a queue, dataset, registry or credential with a project (apiserver services/access). The server
// finds the share by its id and refuses the revoke when the signed-in user may not make it.
@Injectable({providedIn: 'root'})
export class ProjectShareService {
  private api = inject(SmApiRequestsService);

  unshare(shareId: string): Observable<unknown> {
    return this.api.post(`${HTTP.API_BASE_URL}/access.unshare`, {share_id: shareId}, {});
  }
}
