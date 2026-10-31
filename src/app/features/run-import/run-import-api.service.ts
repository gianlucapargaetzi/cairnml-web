import {inject, Injectable} from '@angular/core';
import {lastValueFrom} from 'rxjs';
import {HTTP} from '~/app.constants';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';

/** The answer of imports.prepare_upload: one presigned PUT, or a multipart upload with one URL per part. */
export interface StagedUpload {
  id: string;
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  multipart?: { part_bytes: number; parts: number };
}

export interface PreparedPart {
  url: string;
  headers?: Record<string, string>;
}

export interface RunImportResult {
  id: string;
  project: string;
  name: string;
  scalars: number;
  artifacts: string[];
  warnings: string[];
}

/** The imports service: stage a run's ZIP in the object store, then import it as a new task. */
@Injectable({providedIn: 'root'})
export class RunImportApiService {
  private api = inject(SmApiRequestsService);

  private call<T>(action: string, body: object): Promise<T> {
    return lastValueFrom(this.api.post<T>(`${HTTP.API_BASE_URL}/imports.${action}`, body, {}));
  }

  prepareUpload(name: string, size: number, sha256: string): Promise<StagedUpload> {
    return this.call<StagedUpload>('prepare_upload', {name, size, sha256, content_type: 'application/zip'});
  }

  preparePart(id: string, part: number): Promise<PreparedPart> {
    return this.call<PreparedPart>('prepare_part', {id, part});
  }

  commit(id: string, parts?: { number: number; etag: string }[]): Promise<unknown> {
    return this.call('commit', parts ? {id, parts} : {id});
  }

  run(id: string): Promise<RunImportResult> {
    return this.call<RunImportResult>('run', {id});
  }
}
