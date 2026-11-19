import {inject, Injectable} from '@angular/core';
import {lastValueFrom} from 'rxjs';
import {ApiImportsService} from '~/business-logic/api-services/imports.service';

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
  private imports = inject(ApiImportsService);


  prepareUpload(name: string, size: number, sha256: string): Promise<StagedUpload> {
    return lastValueFrom(this.imports.importsPrepareUpload({name, size, sha256, content_type: 'application/zip'}));
  }

  preparePart(id: string, part: number): Promise<PreparedPart> {
    return lastValueFrom(this.imports.importsPreparePart({id, part}));
  }

  commit(id: string, parts?: { number: number; etag: string }[]): Promise<unknown> {
    return lastValueFrom(this.imports.importsCommit(parts ? {id, parts} : {id}));
  }

  run(id: string): Promise<RunImportResult> {
    return lastValueFrom(this.imports.importsRun({id}));
  }
}
