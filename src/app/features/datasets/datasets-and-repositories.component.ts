import {Component, DestroyRef, inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectRouterConfig} from '@common/core/reducers/router-reducer';
import {DATASETS_ROUTES} from '~/features/datasets/datasets.consts';
import {headerActions} from '@common/core/actions/router.actions';
import {debounceTime, distinctUntilChanged, filter, map} from 'rxjs/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {RouterOutlet} from '@angular/router';
import {PageHeaderComponent} from '@common/shared/ui-components/layout/page-header/page-header.component';

// The Datasets & Repositories page: its two tabs are the header strip, and each tab is a child route with its own table.
@Component({
  selector: 'sm-datasets-and-repositories',
  templateUrl: './datasets-and-repositories.component.html',
  styleUrls: ['./datasets-and-repositories.component.scss'],
  imports: [
    RouterOutlet,
    PageHeaderComponent
  ]
})
export class DatasetsAndRepositoriesComponent {
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.store.select(selectRouterConfig)
      .pipe(
        takeUntilDestroyed(),
        debounceTime(100),
        map(conf => conf?.[1]),
        filter(feature => !!feature),
        distinctUntilChanged(),
      )
      .subscribe((feature) => {
        this.store.dispatch(headerActions.setTabs({contextMenu: DATASETS_ROUTES, active: feature}));
      });

    this.destroyRef.onDestroy(() => {
      this.store.dispatch(headerActions.reset());
    });
  }
}
