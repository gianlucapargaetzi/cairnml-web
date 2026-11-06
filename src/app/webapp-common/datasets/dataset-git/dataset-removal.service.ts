import {inject, Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Observable, of} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {DatasetAccessService} from './dataset-access.service';

export interface DatasetRemoval {
  // the id that datasets.delete takes
  id: string;
  // the repository, or the registry's repository
  name: string;
  kind: 'repo' | 'registry';
}

// Removes a dataset (a registry with its datasets) after a confirmation. Used by the Datasets page and the dataset
// registry page, so both say the same thing. Resolves true when removed and false when the user cancelled; a failed
// removal errors with the server's response (its reason is in meta.result_msg).
@Injectable({providedIn: 'root'})
export class DatasetRemovalService {
  private dialog = inject(MatDialog);
  private datasetApi = inject(DatasetAccessService);

  remove(target: DatasetRemoval): Observable<boolean> {
    const isRegistry = target.kind === 'registry';
    return this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(ConfirmDialogComponent, {
      data: {
        title: `Remove ${target.name}?`,
        body: isRegistry
          ? 'The registry and its datasets stop being listed on the Datasets page. Runs that already used them keep their recorded commit.'
          : 'The dataset stops being listed on the Datasets page. Runs that already used it keep their recorded commit.',
        yes: 'Remove',
        no: 'Cancel',
        iconClass: 'al-ico-dialog-x',
        destructive: true,
      },
      panelClass: 'dialog-sm',
    }).afterClosed().pipe(
      switchMap(confirmed => confirmed
        ? this.datasetApi.remove(target.id).pipe(map(() => true))
        : of(false)),
    );
  }
}
