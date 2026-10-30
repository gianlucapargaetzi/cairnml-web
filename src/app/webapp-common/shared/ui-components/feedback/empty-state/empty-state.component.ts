import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';

/**
 * Empty state for a list or area with no content (docs/design-system/components/feedback.md).
 * Use variant "empty" for "nothing yet" (the sentence says how to fill it) and
 * "filtered" for "no results for these filters" (the action clears the filters).
 * Content projection: [action] for the optional primary action.
 */
@Component({
  selector: 'sm-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule]
})
export class EmptyStateComponent {
  icon = input.required<string>();
  title = input.required<string>();
  description = input<string>();
  variant = input<'empty' | 'filtered'>('empty');
}
