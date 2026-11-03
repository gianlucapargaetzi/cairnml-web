import {Injectable, signal} from '@angular/core';

// Whether a markdown editor is open on the page. Report frames ask for it when they start, so they do not draw over an editor.
@Injectable({providedIn: 'root'})
export class ReportEditStateService {
  readonly editMode = signal(false);
}
