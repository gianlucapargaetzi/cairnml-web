import {ChangeDetectionStrategy, Component, computed, input, output, resource} from '@angular/core';
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
