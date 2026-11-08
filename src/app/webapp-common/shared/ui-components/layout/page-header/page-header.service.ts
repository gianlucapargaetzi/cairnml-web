import {Injectable, signal, TemplateRef} from '@angular/core';

/**
 * What the current page puts into the application header (see `sm-page-header`). The header of the application renders these
 * templates next to its title block and the tabs; the page keeps owning the buttons (their handlers and bindings).
 */
export interface PageHeaderContent {
  description: string | undefined;
  /** `[back]`: back button before the title */
  back: TemplateRef<unknown>;
  /** `[title-edit]`: content inside the title (an inline-editable name) */
  titleEdit: TemplateRef<unknown>;
  /** `[status]`: status badge after the title */
  status: TemplateRef<unknown>;
  /** `[actions]`: the page's buttons, on the right of the header */
  actions: TemplateRef<unknown>;
}

@Injectable({providedIn: 'root'})
export class PageHeaderService {
  readonly content = signal<PageHeaderContent | null>(null);
  private owner: object | null = null;

  register(owner: object, content: PageHeaderContent) {
    this.owner = owner;
    this.content.set(content);
  }

  /** Only the page that registered the content may remove it: a new page registers before the old one is destroyed. */
  unregister(owner: object) {
    if (this.owner === owner) {
      this.owner = null;
      this.content.set(null);
    }
  }
}
