import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, computed, effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import {ColHeaderTypeEnum, ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {get} from 'lodash-es';
import {QUEUES_TABLE_COL_FIELDS} from '../../workers-and-queues.consts';
import {BaseTableView} from '@common/shared/ui-components/data/table/base-table-view';
import {Queue} from '@common/workers-and-queues/actions/queues.actions';
import {
  TableFilterSortComponent
} from '@common/shared/ui-components/data/table/table-filter-sort/table-filter-sort.component';
import {MenuComponent} from '@common/shared/ui-components/panel/menu/menu.component';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {PrimeTemplate} from 'primeng/api';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ClipboardModule} from 'ngx-clipboard';
import {MatMenuItem} from '@angular/material/menu';
import {MatIconModule} from '@angular/material/icon';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {QueuesMenuComponent} from '~/features/workers-and-queues/dumb/queues-menu/queues-menu.component';
import {Store} from '@ngrx/store';
import {selectCanManageQueue} from '@common/core/reducers/users-reducer';
import {EmptyStateComponent} from '@common/shared/ui-components/feedback/empty-state/empty-state.component';
import {MatButton} from '@angular/material/button';


@Component({
  selector: 'sm-queues-table',
  templateUrl: './queues-table.component.html',
  styleUrls: ['./queues-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    QueuesMenuComponent,
    TableFilterSortComponent,
    MenuComponent,
    TableComponent,
    MatIconModule,
    PrimeTemplate,
    ShowTooltipIfEllipsisDirective,
    TooltipDirective,
    ClipboardModule,
    MatMenuItem,
    TimeAgoPipe,
    EmptyStateComponent,
    MatButton,
  ]
})
export class QueuesTableComponent extends BaseTableView {
  override entitiesKey = 'queues';
  override selectedEntitiesKey = 'selectedQueue';

  private changeDetector = inject(ChangeDetectorRef);
  protected canManageQueue = inject(Store).selectSignal(selectCanManageQueue);
  // An empty list (not a loading one, which is null) shows the empty state in place of the table
  protected showEmptyState = computed(() => !this.errorMessage() && this.queues()?.length === 0);

  protected cols = computed(() => {
    const columns = [
      {
        id: QUEUES_TABLE_COL_FIELDS.NAME,
        headerType: ColHeaderTypeEnum.sortFilter,
        header: 'Queue',
        // columns size to their content; a minimum keeps a label readable, and the table scrolls only below the sum of minimums
        style:  {minWidth: this.selectedQueue() ? '200px' : '260px'},
        sortable: true,
      },
      {
        id: QUEUES_TABLE_COL_FIELDS.WORKERS,
        headerType: ColHeaderTypeEnum.sortFilter,
        header: 'Agents',
        style: {minWidth: '90px'},
        sortable: true,
      },
      {
        id: QUEUES_TABLE_COL_FIELDS.TASK,
        headerType: ColHeaderTypeEnum.sortFilter,
        header: 'Next task',
        style: {minWidth: this.selectedQueue() ? '200px' : '220px'},
        sortable: true,
      },
      {
        id: QUEUES_TABLE_COL_FIELDS.LAST_UPDATED,
        headerType: ColHeaderTypeEnum.sortFilter,
        header: 'Last updated',
        style: {minWidth: '150px'},
        sortable: true,
      },
      {
        id: QUEUES_TABLE_COL_FIELDS.IN_QUEUE,
        headerType: ColHeaderTypeEnum.sortFilter,
        header: 'In queue',
        style: {minWidth: '120px'},
        sortable: true,
      }
    ]
    return this.selectedQueue() ? columns : [...columns, {
      id: 'last',
      headerType: ColHeaderTypeEnum.title,
      header: '',
      // the filler after the last column takes the rest of the width; it has no width of its own
      style: {}
    }];
  })

  protected readonly QUEUES_TABLE_COL_FIELDS = QUEUES_TABLE_COL_FIELDS;
  protected menuOpen = signal(false);
  contextQueue: Queue;

  queues = input<Queue[]>();
  selectedQueue = input<Queue[]>();
  short = input(true);
  errorMessage = input<string>();
  queueSelected = output<string>();
  retry = output();
  deleteQueue = output<Queue>();
  renameQueue = output<Queue>();
  clearQueue = output<Queue>();
  sortedChanged = output<{
        isShift: boolean;
        colId: ISmCol['id'];
    }>();
  copySuccess = output<string>();
  createQueue = output();
  clearSearch = output();
  // true while the search box narrows the list, so the empty message can offer to clear the search instead of creating
  searching = input(false);

  constructor() {
    super();
    const effectRef = effect(() => {
      if (this.table() && this.selectedQueue()?.length && this.queues()?.length) {
        window.setTimeout(() => {
          this.table()?.scrollToElement(this.selectedQueue()?.[0]);
        }, 50);
        effectRef.destroy();
      }
    });
  }

  public menuPosition = signal<{ x: number; y: number }>(null);

  getBodyData(rowData: any, col: ISmCol) {
    return get(rowData, col.id);
  }

  openContextMenu(data: {e: MouseEvent; rowData: Queue}) {
    // Only owners and admins have actions on a queue; for everyone else the browser menu stays
    if (!this.canManageQueue()(data.rowData)) {
      return;
    }
    data.e.preventDefault();
    this.table().menu().hide()
    this.contextQueue = data.rowData;
    this.menuOpen.set(false);
    setTimeout(() => {
      this.menuPosition.set({x: data.e.clientX, y: data.e.clientY});
      this.menuOpen.set(true);
      this.changeDetector.detectChanges();
    }, 0);

  }

  onSortChanged(isShift: boolean, colId: ISmCol['id']) {
    this.sortedChanged.emit({isShift, colId});
    this.scrollTableToTop();
  }

  emitSelection(selection: any[]) {
  }
}
