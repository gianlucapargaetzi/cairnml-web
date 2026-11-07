import {Injectable, signal} from '@angular/core';

// Bumped when a dialog opened from the page header adds a dataset or a repository, so the tab's table reads again.
@Injectable({providedIn: 'root'})
export class DatasetsPageRefreshService {
  readonly version = signal(0);

  bump() {
    this.version.update(n => n + 1);
  }
}
