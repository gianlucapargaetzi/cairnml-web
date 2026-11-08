import {ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, TemplateRef, viewChild} from '@angular/core';
import {PageHeaderTitleService} from './page-header-title.service';
import {PageHeaderService} from './page-header.service';

/**
 * Header content of a page (docs/design-system/03-layout-system.md, 3.2). There is one header for the whole application, at the
 * top of the window; this component does not draw anything in the page. It hands the title and the projected content to that
 * header. Content projection:
 *  - [back]: optional back button, before the title
 *  - [title-edit]: content inside the title (an inline-editable name); used when the title can be renamed
 *  - [status]: optional status badge, after the title
 *  - [actions]: buttons on the right: symbol-only (`class="header-action"` with a `data-tip` label), at most one primary
 */
@Component({
  selector: 'sm-page-header',
  template: `
    <ng-template #back><ng-content select="[back]"></ng-content></ng-template>
    <ng-template #titleEdit><ng-content select="[title-edit]"></ng-content></ng-template>
    <ng-template #status><ng-content select="[status]"></ng-content></ng-template>
    <ng-template #actions><ng-content select="[actions]"></ng-content></ng-template>
  `,
  host: {style: 'display: none'},
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: []
})
export class PageHeaderComponent {
  title = input<string>('');
  description = input<string>();

  private titleService = inject(PageHeaderTitleService);
  private headerService = inject(PageHeaderService);

  private back = viewChild.required<TemplateRef<unknown>>('back');
  private titleEdit = viewChild.required<TemplateRef<unknown>>('titleEdit');
  private status = viewChild.required<TemplateRef<unknown>>('status');
  private actions = viewChild.required<TemplateRef<unknown>>('actions');

  constructor() {
    effect(() => this.titleService.title.set(this.title()));
    effect(() => this.headerService.register(this, {
      description: this.description(),
      back: this.back(),
      titleEdit: this.titleEdit(),
      status: this.status(),
      actions: this.actions(),
    }));
    inject(DestroyRef).onDestroy(() => {
      this.titleService.title.set(null);
      this.headerService.unregister(this);
    });
  }
}
