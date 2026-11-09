import {EntityChipComponent} from '@common/shared/ui-components/tags/entity-chip/entity-chip.component';
import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {Store} from '@ngrx/store';
import {PrimeTemplate} from 'primeng/api';
import {of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {EmptyStateComponent} from '@common/shared/ui-components/feedback/empty-state/empty-state.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {RepoAccessBadgeComponent} from '@common/shared/ui-components/data/repo-access-badge/repo-access-badge.component';
import {RepoAccess} from '@common/shared/services/repo-access.service';
import {addMessage} from '@common/core/actions/layout.actions';
import {MESSAGES_SEVERITY} from '@common/constants';
import {CodeRepository, DatasetAccessService, RepositoryBinding} from '../dataset-git/dataset-access.service';
import {DatasetsPageRefreshService} from '../dataset-git/datasets-page-refresh.service';
import {NONE_NEEDED} from '../dataset-credential-dialog/dataset-credential-dialog.component';
import {assignBindingCredential, bindingAccess} from '../dataset-credential-dialog/assign-credentials';

// The code repositories runs use, as the Datasets table lists datasets: one row per repository, which opens into the
// projects that use it. Each project (a binding) shows how it reads the repository and, to the one who may, lets them
// assign a credential: the project's owner, the user who first used the repository there, or an admin.
@Component({
  selector: 'sm-repositories-page',
  templateUrl: './repositories-page.component.html',
  styleUrls: ['./repositories-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TableComponent,
    PrimeTemplate,
    EmptyStateComponent,
    TooltipDirective,
    ShowTooltipIfEllipsisDirective,
    RepoAccessBadgeComponent,
    MatIcon,
    MatIconButton,
    EntityChipComponent,
  ],
})
export class RepositoriesPageComponent {
  private access = inject(DatasetAccessService);
  private dialog = inject(MatDialog);
  private store = inject(Store);

  // bumped to read the repositories again after a change
  private readonly pageRefresh = inject(DatasetsPageRefreshService);
  private readonly reloads = signal(0);

  protected readonly repositories = rxResource<CodeRepository[], number>({
    params: () => this.reloads() + this.pageRefresh.version(),
    stream: () => this.access.repositories().pipe(catchError(() => of([] as CodeRepository[]))),
  });

  protected readonly columns: ISmCol[] = [
    {id: 'name', header: 'Repository', sortable: false},
    {id: 'projects', header: 'Projects', sortable: false},
    {id: 'access', header: 'Access', sortable: false},
    {id: 'last_used', header: 'Last used', sortable: false},
  ];

  protected readonly rows = computed(() => (this.repositories.value() ?? []).map(repo => ({
    id: repo.id,
    name: `${repo.host}/${repo.path}`,
    projects: repo.bindings.length === 1 ? (repo.bindings[0].project_name ?? 'No project') : `${repo.bindings.length} projects`,
    access: this.summary(repo),
    last_used: this.lastUsed(repo),
    repo,
  })));

  // the access of the row: that of its only project, or a count of the ones that need a decision
  private summary(repo: CodeRepository): string {
    if (repo.bindings.length === 1) {
      return '';
    }
    const unassigned = repo.bindings.filter(binding => binding.state !== 'assigned' && binding.state !== 'none_needed').length;
    return unassigned ? `${unassigned} without an assigned credential` : 'All assigned';
  }

  private lastUsed(repo: CodeRepository): string {
    const times = repo.bindings.map(binding => binding.last_used).filter(Boolean).map(value => new Date(value).getTime());
    return times.length ? new Date(Math.max(...times)).toLocaleDateString() : '–';
  }

  protected access$(repo: CodeRepository, binding: RepositoryBinding): RepoAccess {
    return bindingAccess(repo, binding);
  }

  protected changeCredential(repo: CodeRepository, binding: RepositoryBinding): void {
    assignBindingCredential(this.dialog, this.access, repo, binding).subscribe(saved => {
      if (!saved) {
        return;
      }
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, `${repo.host}/${repo.path} is read with its new credential`));
      this.reloads.update(n => n + 1);
    });
  }

  protected readonly noneNeeded = NONE_NEEDED;
}
