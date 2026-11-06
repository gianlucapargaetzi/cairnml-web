import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {HTTP} from '~/app.constants';
import {RegistryEntry, RegistryRecord} from './dataset-git.model';

export interface RegistryRefreshCounts {
  added: number;
  updated: number;
  removed: number;
}

@Injectable({providedIn: 'root'})
export class DatasetRegistryService {
  private api = inject(SmApiRequestsService);

  // The entries of the dataset registry (read-only; the server returns none when the registry is not configured).
  entries(): Observable<RegistryEntry[]> {
    return this.api.post<{ datasets?: RegistryEntry[] }>(`${HTTP.API_BASE_URL}/dataset_registry.get_all`, {}, {})
      .pipe(map(response => response?.datasets ?? []));
  }

  // The registries the server reads, for everyone. A registry is removed as its dataset (DatasetAccessService.remove).
  registries(): Observable<RegistryRecord[]> {
    return this.api.post<{ registries?: RegistryRecord[] }>(`${HTTP.API_BASE_URL}/dataset_registry.get_registries`, {}, {})
      .pipe(map(response => response?.registries ?? []));
  }

  // Re-reads the registry from GitHub, by the id of its dataset. Resolves with the counts of the entries changed.
  refresh(id: string): Observable<RegistryRefreshCounts> {
    return this.api.post<RegistryRefreshCounts>(`${HTTP.API_BASE_URL}/dataset_registry.refresh`, {id}, {});
  }

  add(repository: string): Observable<unknown> {
    return this.api.post(`${HTTP.API_BASE_URL}/dataset_registry.add`, {repository}, {});
  }
}
