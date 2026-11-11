import {MatDialog} from '@angular/material/dialog';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {RepoAccess} from '@common/shared/services/repo-access.service';
import {Repo, RepositoriesService} from '../dataset-git/repositories.service';
import {DatasetCredentialDialogComponent} from './dataset-credential-dialog.component';

// Opens the assignment of the signed-in user's own credential for a repository: the credentials the server lists for them (their
// own, and the company's; the company's only for a shared repository), and "None needed" when the host clones it without one.
// Emits true when something was saved.
export function assignCredentials(dialog: MatDialog, repositories: RepositoriesService, row: RepoAccess): Observable<boolean> {
  return dialog.open(DatasetCredentialDialogComponent, {
    data: {
      name: row.url,
      credential: null,
      noneNeededLabel: 'None needed (public)',
      options: (row.assignable ?? []).map(option => ({
        id: option.id, name: option.name, type: option.kind === 'app' ? 'GitHub App' : 'Git credential',
        scope: option.company ? 'company' as const : 'user' as const,
      })),
      save: (credential: string, noneNeeded = false) => repositories.assign(row.id, credential, noneNeeded),
    },
    panelClass: 'dialog-md',
  }).afterClosed().pipe(map(saved => !!saved));
}

// The same for a repository of the list, with the user's current assignment shown and clearable.
export function assignRepoCredential(dialog: MatDialog, repositories: RepositoriesService, repo: Repo): Observable<boolean> {
  const mine = repo.assignments.find(assignment => assignment.mine);
  return dialog.open(DatasetCredentialDialogComponent, {
    data: {
      name: `${repo.host}/${repo.path}`,
      credential: mine?.credential ?? null,
      noneNeeded: mine?.none_needed ?? false,
      noneNeededLabel: repo.anonymous === false ? undefined : 'None needed (public)',
      clearable: !!mine,
      options: repo.credentials.map(option => ({
        id: option.id, name: option.name, type: option.kind === 'app' ? 'GitHub App' : 'Git credential',
        scope: option.company ? 'company' as const : 'user' as const,
      })),
      save: (credential: string, noneNeeded = false) => repositories.assign(repo.id, credential, noneNeeded),
    },
    panelClass: 'dialog-md',
  }).afterClosed().pipe(map(saved => !!saved));
}
