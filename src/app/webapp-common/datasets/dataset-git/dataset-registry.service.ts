import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {HTTP} from '~/app.constants';
import {RegistryEntry} from './dataset-git.model';

@Injectable({providedIn: 'root'})
export class DatasetRegistryService {
  private api = inject(SmApiRequestsService);

  // The entries of the dataset registry (read-only; the server returns none when the registry is not configured).
  entries(): Observable<RegistryEntry[]> {
    return this.api.post<{ datasets?: RegistryEntry[] }>(`${HTTP.API_BASE_URL}/dataset_registry.get_all`, {}, {})
      .pipe(map(response => response?.datasets ?? []));
  }
}
