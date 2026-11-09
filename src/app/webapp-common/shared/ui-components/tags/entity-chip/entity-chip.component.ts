import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';

/**
 * A reference to something inside the app (a project, a dataset, a queue) shown in a table or a list: an icon and the
 * name in a tag-like pill. With a link the pill opens the thing it names; with `removable` it has a small remove button.
 */
@Component({
  selector: 'sm-entity-chip',
  templateUrl: './entity-chip.component.html',
  styleUrls: ['./entity-chip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, TooltipDirective, ShowTooltipIfEllipsisDirective],
})
export class EntityChipComponent {
  label = input.required<string>();
  icon = input<string>('al-ico-projects');
  link = input<unknown[] | null>(null);
  queryParams = input<Record<string, string> | null>(null);
  removable = input(false);
  removeLabel = input('Remove');
  remove = output<void>();
}
