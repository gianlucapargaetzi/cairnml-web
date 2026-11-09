import {MatDialog} from '@angular/material/dialog';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {RepoAccess} from '@common/shared/services/repo-access.service';
import {CodeRepository, DatasetAccessService, RepositoryBinding} from '../dataset-git/dataset-access.service';
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

// How a project reads a code repository, as the badge shows it.
export function bindingAccess(repo: CodeRepository, binding: RepositoryBinding): RepoAccess {
  return {
    repository: repo.url, url: repo.url, binding: binding.id, project: binding.project, state: binding.state,
    via: binding.credential ? (binding.assignable.find(option => option.id === binding.credential)?.name ?? 'the assigned credential') : '',
    message: binding.message, can_assign: binding.can_assign, ask: false,
  };
}

// Opens the assignment of the credential a project reads a code repository with. Emits true when something was saved.
export function assignBindingCredential(dialog: MatDialog, access: DatasetAccessService, repo: CodeRepository,
                                        binding: RepositoryBinding): Observable<boolean> {
  return dialog.open(DatasetCredentialDialogComponent, {
    data: {
      name: `${repo.host}/${repo.path}`,
      credential: binding.credential,
      noneNeeded: binding.none_needed,
      noneNeededLabel: repo.anonymous === false ? undefined :
        (repo.host === 'github.com' ? 'None needed (public on GitHub)' : `None needed (public on ${repo.host})`),
      clearable: !!binding.credential || binding.none_needed,
      options: binding.assignable.map(option => ({
        id: option.id, name: option.name, type: option.kind === 'app' ? 'GitHub App' : 'Git credential',
        scope: option.company ? 'company' as const : 'user' as const,
      })),
      save: (credential: string, noneNeeded = false) => access.setBindingCredential(binding.id, credential, noneNeeded),
    },
    panelClass: 'dialog-md',
  }).afterClosed().pipe(map(saved => !!saved));
}
