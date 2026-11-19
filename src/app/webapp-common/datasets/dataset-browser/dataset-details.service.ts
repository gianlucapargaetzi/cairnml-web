import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {ApiRepositoriesService} from '~/business-logic/api-services/repositories.service';

export interface DatasetCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  parents: string[];
}

export interface DatasetMetadata {
  modalities: Record<string, string>;
  labels: Record<string, string>;
  splits: Record<string, number>;
  samples: number | null;
}

// What repositories.get_details returns: see apiserver/bll/repository_details.py.
export interface DatasetDetails {
  kind: 'own' | 'registry';
  name: string;
  repository: string | null;
  link: string;
  source?: string;
  revision: string | null;
  branch: string | null;
  metadata: DatasetMetadata | null;
  description: string | null;
  commits: DatasetCommit[];
}

export interface DatasetDetailsRequest {
  // a repository by id, address or reference, or one of a registry's datasets by its entry id
  ref?: string;
  entry?: string;
  commit?: string;
}

@Injectable({providedIn: 'root'})
export class DatasetDetailsService {
  private repositories = inject(ApiRepositoriesService);

  // The details of one dataset: its metadata, its DATASET.md and its commit history, read through the GitHub App.
  details(request: DatasetDetailsRequest): Observable<DatasetDetails> {
    return this.repositories.repositoriesGetDetails(request);
  }
}
