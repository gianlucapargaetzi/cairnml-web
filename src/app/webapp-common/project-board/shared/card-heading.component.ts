import {ChangeDetectionStrategy, Component, input} from '@angular/core';

/**
 * The heading every board card that is not an old overview panel starts with: what the card shows (the title) and which runs, dataset or
 * machines it is about (the scope), so that reading it is enough to know what the numbers mean.
 */
@Component({
  selector: 'sm-board-card-heading',
  template: `
    <h2 class="title" data-id="cardTitle">{{ title() }}</h2>
    @if (scope()) {
      <div class="scope" data-id="cardScope">{{ scope() }}</div>
    }`,
  styles: [`
    :host {
      display: block;
      flex: none;
    }

    .title {
      margin: 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-medium);
    }

    .scope {
      font-size: var(--font-size-sm);
      color: var(--color-on-surface-variant);
    }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardHeadingComponent {
  readonly title = input.required<string>();
  readonly scope = input<string>();
}
