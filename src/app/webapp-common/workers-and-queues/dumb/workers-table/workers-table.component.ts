import {ChangeDetectionStrategy, Component, computed, effect, inject, input, output, viewChild} from '@angular/core';
import {BreakpointObserver} from '@angular/cdk/layout';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs/operators';
import {ColHeaderTypeEnum, ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {get} from 'lodash-es';
import {AGENT_VERSION_COLUMN_MIN_WIDTH_QUERY, WORKERS_TABLE_COL_FIELDS} from '../../workers-and-queues.consts';
import {BaseTableView} from '@common/shared/ui-components/data/table/base-table-view';
import {WorkerExt} from '@common/workers-and-queues/actions/workers.actions';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {PrimeTemplate} from 'primeng/api';
import {DurationFormaterPipe} from '@common/shared/pipes/duration-formater.pipe';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {
  TableFilterSortComponent
} from '@common/shared/ui-components/data/table/table-filter-sort/table-filter-sort.component';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {StatusIconLabelComponent} from '@common/shared/experiment-status-icon-label/status-icon-label.component';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';

const AGENT_STATUS_LABELS = {active: 'Online', stopped: 'Offline'};


@Component({
  selector: 'sm-workers-table',
  templateUrl: './workers-table.component.html',
  styleUrls: ['./workers-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TableComponent,
    PrimeTemplate,
    DurationFormaterPipe,
    TooltipDirective,
    TableFilterSortComponent,
    ShowTooltipIfEllipsisDirective,
    StatusIconLabelComponent,
    TimeAgoPipe,
  ]
})
export class WorkersTableComponent extends BaseTableView {
  override entitiesKey = 'workers';
  override selectedEntitiesKey = 'selectedWorker';

  private breakpointObserver = inject(BreakpointObserver);
  private wideScreen = toSignal(
    this.breakpointObserver.observe(AGENT_VERSION_COLUMN_MIN_WIDTH_QUERY).pipe(map(result => result.matches)),
    {initialValue: true}
  );

  protected cols = computed(() => [
    {
      id: WORKERS_TABLE_COL_FIELDS.ID,
      headerType: ColHeaderTypeEnum.sortFilter,
      header: 'Agent',
      style: {width: '160px', maxWidth: '700px'},
      sortable: true,
    },
    {
      id: WORKERS_TABLE_COL_FIELDS.STATUS,
      headerType: ColHeaderTypeEnum.sortFilter,
      header: 'Status',
      style: {width: '100px', maxWidth: '130px'},
      sortable: true,
    },
    {
      id: WORKERS_TABLE_COL_FIELDS.TASK,
      headerType: ColHeaderTypeEnum.sortFilter,
      header: 'Currently running task',
      style: {width: '160px', maxWidth: '700px'},
      sortable: true,
    },
    {
      id: WORKERS_TABLE_COL_FIELDS.TASK_RUNNING_TIME,
      headerType: ColHeaderTypeEnum.sortFilter,
      header: 'Task running time',
      style: {width: '140px', minWidth: '140px', maxWidth: '200px'},
      sortable: true,
    },
    {
      id: WORKERS_TABLE_COL_FIELDS.TASK_ITERATIONS,
      headerType: ColHeaderTypeEnum.sortFilter,
      header: 'Iteration',
      style: {width: '80px', maxWidth: '120px'},
      sortable: true,
    },
    {
      id: WORKERS_TABLE_COL_FIELDS.LAST_SEEN,
      headerType: ColHeaderTypeEnum.sortFilter,
      header: 'Last seen',
      style: {width: '120px', maxWidth: '160px'},
      sortable: true,
    },
    {
      id: WORKERS_TABLE_COL_FIELDS.VERSION,
      headerType: ColHeaderTypeEnum.sortFilter,
      header: 'Version and mode',
      style: {width: '220px', maxWidth: '300px'},
      sortable: true,
      hidden: !this.wideScreen(),
    },
  ] as ISmCol[]);
  protected readonly WORKERS_TABLE_COL_FIELDS = WORKERS_TABLE_COL_FIELDS;
  protected readonly AGENT_STATUS_LABELS = AGENT_STATUS_LABELS;

  workers = input<WorkerExt[]>();
  selectedWorker = input<WorkerExt>();
  workerSelected = output<WorkerExt>();
  sortedChanged = output<{
        isShift: boolean;
        colId: ISmCol['id'];
    }>();

  tableContainer = viewChild<HTMLDivElement>('tableContainer');

  constructor() {
    super();
    effect(() => {
      if (this.workers() && this.selectedWorker()) {
        this.table()?.focusSelected();
        const index = this.workers().findIndex(w => w.id === this.selectedWorker().id)
        if (index > -1) {
          this.table().scrollToIndex(index);
        }
      }
    });
  }

  versionAndMode(worker: WorkerExt): string {
    return `Version ${worker.agent_version || '—'} · Mode ${worker.run_mode || '—'}`;
  }

  getBodyData(rowData: any, col: ISmCol): any {
    return get(rowData, col.id);
  }

  onRowClicked(event) {
    this.workerSelected.emit(event.data);
  }

  override scrollTableToTop() {
    this.tableContainer().scroll({top: 0});
  }

  onSortChanged(isShift: boolean, colId: ISmCol['id']) {
    this.sortedChanged.emit({isShift, colId});
    this.scrollTableToTop();
  }


  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  emitSelection(selection: any[]) {}

  openContextMenu(data: { e: Event; rowData; single?: boolean; backdrop?: boolean }) {}
}
