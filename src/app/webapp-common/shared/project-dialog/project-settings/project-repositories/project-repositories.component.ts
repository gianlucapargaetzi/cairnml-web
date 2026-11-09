import {ChangeDetectionStrategy, Component, inject, input, OnInit, signal} from '@angular/core';
import {lastValueFrom} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {RepoAccessBadgeComponent} from '@common/shared/ui-components/data/repo-access-badge/repo-access-badge.component';
import {RepoAccess} from '@common/shared/services/repo-access.service';
import {
  CodeRepository,
  DatasetAccessService,
  RepositoryBinding
} from '@common/datasets/dataset-git/dataset-access.service';
import {assignBindingCredential, bindingAccess} from '@common/datasets/dataset-credential-dialog/assign-credentials';
import {RepositoryAddDialogComponent} from '@common/datasets/repository-add-dialog/repository-add-dialog.component';
import {ProjectSettingsStore} from '~/features/dashboard-search/project-settings-dashboard-search-permissions.store';

interface RepositoryRow {
  key: string;
  name: string;
  owner: string;
  repo: CodeRepository;
  binding: RepositoryBinding;
  access: RepoAccess;
}

/**
 * The code repositories of a project: the ones its runs named and the ones its owner listed. Jobs of the project read
 * them with the credential assigned here, as soon as they are listed, whoever of the project's members queued them. The
 * owner lists repositories and assigns their credentials.
 */
@Component({
  selector: 'sm-project-repositories',
  templateUrl: './project-repositories.component.html',
  styleUrls: ['./project-repositories.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButton, MatIcon, MatIconButton, TooltipDirective, RepoAccessBadgeComponent],
})
export class ProjectRepositoriesComponent implements OnInit {
  private access = inject(DatasetAccessService);
  private dialog = inject(MatDialog);
  protected settingsStore = inject(ProjectSettingsStore);

  projectId = input.required<string>();

  protected readonly rows = signal<RepositoryRow[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);

  ngOnInit() {
    this.load();
  }

  protected async load() {
    this.error.set(null);
    try {
      const repositories = await lastValueFrom(this.access.repositories(this.projectId()));
      this.rows.set(repositories.flatMap(repo => repo.bindings.map(binding => ({
        key: binding.id,
        name: `${repo.host}/${repo.path}`,
        owner: binding.owner_name,
        repo,
        binding,
        access: bindingAccess(repo, binding),
      }))));
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The repositories of the project could not be loaded.');
    }
  }

  protected addRepository() {
    this.dialog.open(RepositoryAddDialogComponent, {data: {project: this.projectId()}, panelClass: 'dialog-md'})
      .afterClosed().subscribe(added => {
        if (added) {
          this.load();
        }
      });
  }

  protected assign(row: RepositoryRow) {
    assignBindingCredential(this.dialog, this.access, row.repo, row.binding).subscribe(saved => {
      if (saved) {
        this.load();
      }
    });
  }
}
