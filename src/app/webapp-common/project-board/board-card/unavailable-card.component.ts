import {ChangeDetectionStrategy, Component, input} from '@angular/core';

/** What a card shows when its type has no body in this version of the app. The inputs are the ones every card body declares. */
@Component({
  selector: 'sm-unavailable-card',
  template: '<p class="note" data-id="boardCardUnavailable">This card is not available in this version of the app.</p>',
  styles: ['.note { margin: 0; color: var(--color-on-surface-variant); font-size: var(--font-size-md); }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnavailableCardComponent {
  readonly projectId = input<string>();
  readonly settings = input<Record<string, unknown>>({});
}
