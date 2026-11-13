import {ChangeDetectionStrategy, Component, input} from '@angular/core';

/** The row of figures of a card: the same panels as the figures of the Contributions card. */
@Component({
  selector: 'sm-board-tiles',
  template: '<ng-content></ng-content>',
  styles: [`
    :host {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: var(--space-4);
    }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardTilesComponent {}

/** One figure: a value over its label, in a panel. `tone` colours the label's attention, `warning` for something to look at. */
@Component({
  selector: 'sm-board-tile',
  template: `
    <span class="value" data-id="tileValue">{{ value() }}</span>
    <span class="label">{{ label() }}</span>`,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      padding: var(--space-3);
      border: 1px solid var(--color-surface-container-high);
      border-radius: var(--radius-md);
      background-color: var(--color-surface-container-lowest);
    }

    .value {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-medium);
    }

    .label {
      font-size: var(--font-size-sm);
      color: var(--color-on-surface-variant);
    }

    :host(.warning) .label {
      color: var(--color-warning);
    }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardTileComponent {
  readonly value = input.required<string | number>();
  readonly label = input.required<string>();
}
