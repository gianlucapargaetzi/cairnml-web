import {Component, DestroyRef, inject, signal} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatIconButton} from '@angular/material/button';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {RepositoryAddDialogComponent} from '@common/datasets/repository-add-dialog/repository-add-dialog.component';
import {DatasetHowToComponent} from '@common/datasets/dataset-how-to/dataset-how-to.component';
import {DatasetsPageRefreshService} from '@common/datasets/dataset-git/datasets-page-refresh.service';
import {Store} from '@ngrx/store';
import {selectRouterConfig} from '@common/core/reducers/router-reducer';
import {DATASETS_ROUTES} from '~/features/datasets/datasets.consts';
import {headerActions} from '@common/core/actions/router.actions';
import {debounceTime, distinctUntilChanged, filter, map} from 'rxjs/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {RouterOutlet} from '@angular/router';
import {PageHeaderComponent} from '@common/shared/ui-components/layout/page-header/page-header.component';

// The Repositories & Datasets page: one list of code repositories, datasets and registries.
@Component({
  selector: 'sm-datasets-and-repositories',
  templateUrl: './datasets-and-repositories.component.html',
  styleUrls: ['./datasets-and-repositories.component.scss'],
  imports: [
    RouterOutlet,
    PageHeaderComponent,
    MatButton,
    MatIconButton,
    MatIcon,
    TooltipDirective,
  ]
})
export class DatasetsAndRepositoriesComponent {
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private refresh = inject(DatasetsPageRefreshService);

  // the tab shown: its add button is the page's primary action
  protected readonly activeTab = signal<string>('datasets');

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
        this.activeTab.set(feature);
        this.store.dispatch(headerActions.setTabs({contextMenu: DATASETS_ROUTES, active: feature}));
      });

    this.destroyRef.onDestroy(() => {
      this.store.dispatch(headerActions.reset());
    });
  }

  protected add() {
    this.dialog.open(RepositoryAddDialogComponent, {panelClass: 'dialog-md'}).afterClosed()
      .subscribe(added => added && this.refresh.bump());
  }

  protected openHelp() {
    this.dialog.open(DatasetHowToComponent, {panelClass: 'dialog-xxl'});
  }
}
