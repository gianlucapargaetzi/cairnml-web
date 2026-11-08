import {inject, Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Observable, of} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {RepoAccessService} from '@common/shared/services/repo-access.service';
import {DispatchWarningDialogComponent} from './dispatch-warning-dialog.component';

// Asked before tasks are dispatched: whether any task's repository has no credential assigned and is not reached by the
// company's access. When one has, the warning dialog decides; otherwise the dispatch goes on without a word.
@Injectable({providedIn: 'root'})
export class DispatchGuardService {
  private repoAccess = inject(RepoAccessService);
  private dialog = inject(MatDialog);

  // true: dispatch; false: the user stopped it. A failed requirement check never stops a dispatch (the server checks again).
  confirm(tasks: string[]): Observable<boolean> {
    return this.repoAccess.requirement(tasks).pipe(
      switchMap(rows => rows.some(row => row.ask) ?
        this.dialog.open<DispatchWarningDialogComponent, unknown, boolean>(DispatchWarningDialogComponent, {
          data: {rows, tasks},
          panelClass: 'dialog-md',
        }).afterClosed().pipe(map(answer => !!answer)) :
        of(true)),
    );
  }
}
