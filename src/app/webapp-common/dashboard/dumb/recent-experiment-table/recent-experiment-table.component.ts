import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {TaskProgressComponent} from '@common/shared/ui-components/data/task-progress/task-progress.component';
import {IRecentTask} from '../../common-dashboard.reducer';
import {RECENT_EXPERIMENTS_TABLE_COLS, RECENT_TASKS_TABLE_COL_FIELDS} from '../../common-dashboard.const';
import {TIME_FORMAT_STRING} from '@common/constants';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {ExperimentTypeIconLabelComponent} from '@common/shared/experiment-type-icon-label/experiment-type-icon-label.component';
import {StatusIconLabelComponent} from '@common/shared/experiment-status-icon-label/status-icon-label.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {TaskNameComponent} from '@common/shared/ui-components/data/task-name/task-name.component';
import {PrimeTemplate} from 'primeng/api';
import {DatePipe} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';

@Component({
  selector: 'sm-recent-tasks-table',
  templateUrl: './recent-experiment-table.component.html',
  styleUrls: ['./recent-experiment-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TaskProgressComponent,
    TaskNameComponent,
    TableComponent,
    ShowTooltipIfEllipsisDirective,
    ShowTooltipIfEllipsisDirective,
    ExperimentTypeIconLabelComponent,
    StatusIconLabelComponent,
    TooltipDirective,
    TooltipDirective,
    PrimeTemplate,
    DatePipe,
    MatIconModule,
    MatIconButton,
    ClickStopPropagationDirective
  ]
})
export class RecentExperimentTableComponent {

  public readonly RECENT_TASKS_TABLE_COL_FIELDS = RECENT_TASKS_TABLE_COL_FIELDS;

  tasks = input<IRecentTask[]>([]);
  taskSelected = output<IRecentTask>();
  /** The toggle of a search with its trials was clicked: the id of the search. */
  groupToggled = output<string>();
  protected readonly TIME_FORMAT_STRING = TIME_FORMAT_STRING;
  protected cols = RECENT_EXPERIMENTS_TABLE_COLS;
}
