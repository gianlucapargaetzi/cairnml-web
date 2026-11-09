import {MatDialog} from '@angular/material/dialog';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {RepoAccess} from '@common/shared/services/repo-access.service';
import {DatasetAccessService} from '../dataset-git/dataset-access.service';
import {DatasetCredentialDialogComponent} from './dataset-credential-dialog.component';

// Opens the assignment of a repository's credential for the project of a repo-access row (a code repository or a dataset):
// the credentials the server lists for the user, and "None needed" when the host clones it without one. Emits true when
// something was saved.
export function assignCredentials(dialog: MatDialog, access: DatasetAccessService, row: RepoAccess): Observable<boolean> {
  return dialog.open(DatasetCredentialDialogComponent, {
    data: {
      name: row.url,
      credential: null,
      noneNeededLabel: row.anonymous === false ? undefined : 'None needed (public)',
      options: (row.assignable ?? []).map(option => ({
        id: option.id, name: option.name, type: option.kind === 'app' ? 'GitHub App' : 'Git credential',
        scope: option.company ? 'company' as const : 'user' as const,
      })),
      save: (credential: string, noneNeeded = false) => access.setBindingCredential(row.binding, credential, noneNeeded),
    },
    panelClass: 'dialog-md',
  }).afterClosed().pipe(map(saved => !!saved));
}
