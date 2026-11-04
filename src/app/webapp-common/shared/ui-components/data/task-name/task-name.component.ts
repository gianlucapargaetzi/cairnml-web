import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';

// A task in a table: its name, then its id (the hash), as "name: id". The name shrinks with an ellipsis when the cell is
// narrow, so the id stays visible; the full text is in the tooltip.
@Component({
  selector: 'sm-task-name',
  templateUrl: './task-name.component.html',
  styleUrls: ['./task-name.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TooltipDirective],
})
export class TaskNameComponent {
  name = input.required<string>();
  taskId = input.required<string>();
  // a development task is shown in italics, as the table always did
  italic = input(false);

  protected readonly fullText = computed(() => `${this.name()}: ${this.taskId()}`);
}
