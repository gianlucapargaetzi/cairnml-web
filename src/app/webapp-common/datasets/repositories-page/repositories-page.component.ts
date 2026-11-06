import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {rxResource, toSignal} from '@angular/core/rxjs-interop';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {Store} from '@ngrx/store';
import {PrimeTemplate} from 'primeng/api';
import {of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {ApiUsersService} from '~/business-logic/api-services/users.service';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {PageHeaderComponent} from '@common/shared/ui-components/layout/page-header/page-header.component';
import {EmptyStateComponent} from '@common/shared/ui-components/feedback/empty-state/empty-state.component';
import {addMessage} from '@common/core/actions/layout.actions';
import {MESSAGES_SEVERITY} from '@common/constants';
import {selectCurrentUserId, selectIsAdmin} from '@common/core/reducers/users-reducer';
import {CodeRepository, DatasetAccessService, StoredCredential} from '../dataset-git/dataset-access.service';
import {DatasetCredentialDialogComponent} from '../dataset-credential-dialog/dataset-credential-dialog.component';

// The code repositories runs use, with the GitHub App each is read with. The owner (or an admin) changes the App.
@Component({
  selector: 'sm-repositories-page',
  templateUrl: './repositories-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TableComponent, PrimeTemplate, PageHeaderComponent, EmptyStateComponent, MatButtonModule],
})
export class RepositoriesPageComponent {
  private access = inject(DatasetAccessService);
  private usersApi = inject(ApiUsersService);
  private dialog = inject(MatDialog);
  private store = inject(Store);

  protected readonly isAdmin = toSignal(this.store.select(selectIsAdmin), {initialValue: false});
  protected readonly currentUserId = toSignal(this.store.select(selectCurrentUserId), {initialValue: null});

  // bumped to read the repositories and the credentials again after a change
  private readonly reloads = signal(0);

  private readonly repositories = rxResource<CodeRepository[], number>({
    params: () => this.reloads(),
    stream: () => this.access.repositories().pipe(catchError(() => of([] as CodeRepository[]))),
  });

  private readonly credentials = toSignal(
    this.access.credentials().pipe(catchError(() => of([] as StoredCredential[]))),
    {initialValue: [] as StoredCredential[]},
  );

  private readonly userNames = toSignal(
    this.usersApi.usersGetAllEx({only_fields: ['id', 'name']}).pipe(
      map(response => new Map((response.users ?? []).map(user => [user.id, user.name] as [string, string]))),
      catchError(() => of(new Map<string, string>())),
    ),
    {initialValue: new Map<string, string>()},
  );

  protected readonly columns: ISmCol[] = [
    {id: 'ref', header: 'Repository', sortable: false},
    {id: 'owner', header: 'Owner', sortable: false},
    {id: 'credential', header: 'GitHub App', sortable: false},
    {id: 'last_used', header: 'Last used', sortable: false},
    {id: 'actions', header: '', sortable: false},
  ];

  protected readonly rows = computed(() => (this.repositories.value() ?? []).map(repo => ({
    id: repo.id,
    ref: repo.ref,
    owner: this.userNames().get(repo.owner) ?? repo.owner,
    credential: repo.credential
      ? (this.credentials().find(credential => credential.id === repo.credential)?.name ?? repo.credential)
      : 'None: a public repository needs none',
    last_used: repo.last_used ? new Date(repo.last_used).toLocaleDateString() : '–',
    repo,
  })));

  protected canChange(repo: CodeRepository): boolean {
    return repo.owner === this.currentUserId() || this.isAdmin();
  }

  protected changeCredential(repo: CodeRepository): void {
    this.dialog.open(DatasetCredentialDialogComponent, {
      data: {
        name: repo.ref,
        credential: repo.credential,
        save: credential => this.access.setRepositoryCredential(`https://github.com/${repo.ref}`, credential),
      },
      panelClass: 'dialog-md',
    }).afterClosed().subscribe(saved => {
      if (!saved) {
        return;
      }
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, `${repo.ref} is read with its new GitHub App`));
      this.reloads.update(n => n + 1);
    });
  }
}
