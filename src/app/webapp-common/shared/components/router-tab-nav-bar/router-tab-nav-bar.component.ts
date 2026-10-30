import {Component, inject, input, ChangeDetectionStrategy} from '@angular/core';
import {MatTabsModule} from '@angular/material/tabs';
import {Store} from '@ngrx/store';
import {selectRouterConfig} from '@common/core/reducers/router-reducer';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {Link} from '~/features/experiments/experiments.consts';

@Component({
  selector: 'sm-router-tab-nav-bar',
  templateUrl: './router-tab-nav-bar.component.html',
  styleUrls: ['./router-tab-nav-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTabsModule,
    RouterLink,
    RouterLinkActive,
  ]
})
export class RouterTabNavBarComponent {
  private store = inject(Store);

  protected routerConfig = this.store.selectSignal(selectRouterConfig);

  links = input<Link[]>([]);
  splitSize = input<number>();
}
