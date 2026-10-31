import {Injectable, signal} from '@angular/core';

/**
 * Title of the page header on the current page (sm-page-header). The top bar breadcrumb drops its last crumb when it
 * repeats this title, so the page title appears once.
 */
@Injectable({providedIn: 'root'})
export class PageHeaderTitleService {
  readonly title = signal<string | null>(null);
}
