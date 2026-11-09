import {ChangeDetectionStrategy, Component, computed, inject, input, output} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectCanManageQueue} from '@common/core/reducers/users-reducer';
import {Queue} from '@common/workers-and-queues/actions/queues.actions';
import {BaseContextMenuComponent} from '@common/shared/components/base-context-menu/base-context-menu.component';
import {MenuItemComponent} from '@common/shared/ui-components/panel/menu-item/menu-item.component';
import {MenuComponent} from '@common/shared/ui-components/panel/menu/menu.component';
import {MatIconModule} from '@angular/material/icon';
import {ICONS} from '@common/constants';

@Component({
  selector: 'sm-queues-menu',
  templateUrl: './queues-menu.component.html',
  styleUrls: ['./queues-menu.component.scss'],
  imports: [
    MenuItemComponent,
    MenuComponent,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QueuesMenuComponent extends BaseContextMenuComponent {
  menuOpen = input<boolean>();
  selectedQueue = input<Queue>();
  menuPosition = input<{ x: number; y: number }>();
  deleteQueue = output<Queue>();
  clearQueue = output<Queue>();
  protected readonly icons = ICONS;
  // Owner and admins only: the menu is not opened for other users (see QueuesTableComponent)
  private canManageQueue = inject(Store).selectSignal(selectCanManageQueue);
  protected canManage = computed(() => this.canManageQueue()(this.selectedQueue()));
}
