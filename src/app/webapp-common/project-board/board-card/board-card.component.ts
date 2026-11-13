import {ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, output, resource} from '@angular/core';
import {NgComponentOutlet} from '@angular/common';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {BoardCard} from '../board.model';
import {CARD_TYPES} from '../card-registry';
import {UnavailableCardComponent} from './unavailable-card.component';

/**
 * One card of the board: its content, and in edit mode the controls to move it (a handle, which also takes the arrow keys), to open
 * its settings (the pen, only for a card that has settings) and to remove it. A divider is a title with a line and no body.
 */
@Component({
  selector: 'sm-board-card',
  templateUrl: './board-card.component.html',
  styleUrls: ['./board-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet, MatIconButton, MatIcon, TooltipDirective],
})
export class BoardCardComponent {
  readonly card = input.required<BoardCard>();
  readonly projectId = input.required<string>();
  readonly editing = input(false);
  readonly edit = output<void>();
  readonly remove = output<void>();
  /** A card that has just been added fits its height to its content: while this is on, the card reports how high its content is, whether that grew or shrank. */
  readonly autoFit = input(false);
  readonly fit = output<number>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    effect(onCleanup => {
      if (!this.autoFit()) {
        return;
      }
      // the content arrives in steps (the body loads, then its data), so the card measures its content a few times a second and reports
      // when it changed
      let last = 0;
      const timer = setInterval(() => {
        const card = this.host.nativeElement.querySelector<HTMLElement>('.card');
        const body = card?.querySelector<HTMLElement>('.body');
        if (!card || !body) {
          return;
        }
        const style = getComputedStyle(card);
        const needed = body.offsetHeight + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + card.offsetHeight - card.clientHeight;
        if (Math.abs(needed - last) > 1) {
          last = needed;
          this.fit.emit(needed);
        }
      }, 300);
      onCleanup(() => clearInterval(timer));
    });
  }

  protected readonly def = computed(() => CARD_TYPES[this.card().type]);
  protected readonly isDivider = computed(() => this.card().type === 'divider');
  protected readonly title = computed(() => this.isDivider() ? String(this.card().settings['title'] ?? '') : this.def().label);
  protected readonly hasSettings = computed(() => !!this.def().settings);
  protected readonly bodyInputs = computed(() => ({projectId: this.projectId(), settings: this.card().settings}));

  /** The component of the card's body; a type without one, or one that fails to load, shows the unavailable card. */
  protected readonly body = resource({
    params: () => this.card().type,
    loader: async ({params}) => {
      try {
        return (await CARD_TYPES[params].body?.()) ?? UnavailableCardComponent;
      } catch {
        return UnavailableCardComponent;
      }
    },
  });
}
