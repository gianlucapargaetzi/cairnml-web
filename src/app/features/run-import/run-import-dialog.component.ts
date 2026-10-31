import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {RunImportApiService, RunImportResult, StagedUpload} from './run-import-api.service';

type Part = { number: number; etag: string };

class UploadError extends Error {}

@Component({
  selector: 'sm-run-import-dialog',
  templateUrl: './run-import-dialog.component.html',
  styleUrls: ['./run-import-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatProgressSpinnerModule, DialogTemplateComponent]
})
export class RunImportDialogComponent {
  private dialogRef = inject<MatDialogRef<RunImportDialogComponent, boolean>>(MatDialogRef);
  private api = inject(RunImportApiService);

  protected file = signal<File | null>(null);
  protected fileError = signal<string | null>(null);
  protected busy = signal(false);
  protected progress = signal('');
  protected error = signal<string | null>(null);
  protected result = signal<RunImportResult | null>(null);

  protected chooseFile(event: Event) {
    const chosen = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.result.set(null);
    this.error.set(null);
    if (chosen && !chosen.name.toLowerCase().endsWith('.zip')) {
      this.file.set(null);
      this.fileError.set('Choose a ZIP file made with cairnml import prepare.');
      return;
    }
    this.fileError.set(null);
    this.file.set(chosen);
  }

  protected async importRun() {
    const file = this.file();
    if (!file || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.result.set(null);
    try {
      this.progress.set('Checking the file');
      const sha256 = await sha256Hex(file);
      this.progress.set('Asking the server for an upload');
      const staged = await this.api.prepareUpload(file.name, file.size, sha256);
      const parts = await this.sendBytes(staged, file);
      this.progress.set('Checking the stored file');
      await this.api.commit(staged.id, parts);
      this.progress.set('Importing the run');
      this.result.set(await this.api.run(staged.id));
    } catch (error) {
      this.error.set(error instanceof UploadError
        ? error.message
        : (error?.meta?.result_msg ?? 'The run could not be imported. Check the ZIP and try again.'));
    } finally {
      this.progress.set('');
      this.busy.set(false);
    }
  }

  /** Sends the bytes: one presigned PUT, or one PUT per part. Returns the parts for the commit of a multipart upload. */
  private async sendBytes(staged: StagedUpload, file: File): Promise<Part[] | undefined> {
    if (!staged.multipart) {
      this.progress.set('Uploading the file');
      await putBlob(staged.url, file, staged.headers);
      return undefined;
    }
    const {part_bytes, parts} = staged.multipart;
    const etags: Part[] = [];
    for (let number = 1; number <= parts; number++) {
      this.progress.set(`Uploading part ${number} of ${parts}`);
      const prepared = await this.api.preparePart(staged.id, number);
      const blob = file.slice((number - 1) * part_bytes, Math.min(number * part_bytes, file.size));
      const etag = await putBlob(prepared.url, blob, prepared.headers);
      if (!etag) {
        throw new UploadError('The store did not return an ETag for a part. The storage must expose the ETag header to the web app.');
      }
      etags.push({number, etag});
    }
    return etags;
  }

  protected close() {
    this.dialogRef.close(this.result() !== null);
  }
}

async function sha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

/** PUTs bytes to a presigned URL. Resolves with the ETag the store returns, empty if it returns none. */
function putBlob(url: string, blob: Blob, headers: Record<string, string> = {}): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', url);
    for (const [name, value] of Object.entries(headers)) {
      // a page may not set Content-Length; the store reads the length from the body
      if (name.toLowerCase() !== 'content-length') {
        request.setRequestHeader(name, value);
      }
    }
    request.onload = () => request.status >= 200 && request.status < 300
      ? resolve(request.getResponseHeader('ETag') ?? '')
      : reject(new UploadError(`The upload failed (HTTP ${request.status}).`));
    request.onerror = () => reject(new UploadError('The upload failed: the store could not be reached.'));
    request.send(blob);
  });
}
