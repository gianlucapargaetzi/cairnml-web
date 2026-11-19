import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {ApiAccessService} from '~/business-logic/api-services/access.service';

// Removes the share of a queue with a project (apiserver services/access). The server finds the share by its id and refuses the
// revoke when the signed-in user may not make it. Repositories are listed in a project and taken out of it through
// repositories.link and repositories.unlink instead; credentials are never shared with a project.
@Injectable({providedIn: 'root'})
export class ProjectShareService {
  private access = inject(ApiAccessService);

  unshare(shareId: string): Observable<unknown> {
    return this.access.accessUnshare({share_id: shareId});
  }
}
