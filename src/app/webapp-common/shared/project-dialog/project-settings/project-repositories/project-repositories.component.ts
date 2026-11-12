import {ChangeDetectionStrategy, Component, inject, input, OnInit, signal} from '@angular/core';
import {lastValueFrom} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {RepoAccessBadgeComponent} from '@common/shared/ui-components/data/repo-access-badge/repo-access-badge.component';
import {RepoAccess} from '@common/shared/services/repo-access.service';
import {REPO_ROLE_LABELS, Repo, RepositoriesService} from '@common/datasets/dataset-git/repositories.service';
import {RepositoryAddDialogComponent} from '@common/datasets/repository-add-dialog/repository-add-dialog.component';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {ProjectSettingsStore} from '~/features/dashboard-search/project-settings-dashboard-search-permissions.store';
import {serverMessage} from '@common/shared/utils/server-message';

interface RepositoryRow {
  repo: Repo;
  name: string;
  type: string;
  owner: string;
  access: RepoAccess;
}

/**
 * The repositories of a project: code, datasets and registries. A run lists the repositories it uses, and the owner of the project
 * or a collaborator can list more or take one out of the list (the repository itself and its credentials stay). A credential is
 * never bound to the project: each user assigns their own, and the project's owner's is read first (see Repositories & Datasets).
 */
@Component({
  selector: 'sm-project-repositories',
  templateUrl: './project-repositories.component.html',
  styleUrls: ['./project-repositories.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButton, MatIcon, MatIconButton, TooltipDirective, RepoAccessBadgeComponent],
})
export class ProjectRepositoriesComponent implements OnInit {
  private repositories = inject(RepositoriesService);
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
      const repos = await lastValueFrom(this.repositories.list(this.projectId()));
      this.rows.set(repos.map(repo => ({
        repo,
        name: `${repo.host}/${repo.path}`,
        type: repo.roles.map(role => REPO_ROLE_LABELS[role]).join(', '),
        owner: repo.shared ? 'Company' : repo.owner_name,
        access: {
          repository: repo.url, url: repo.url, id: repo.id, project: this.projectId(), state: repo.access.state, via: '',
          message: repo.access.message, warning: repo.access.warning, can_assign: repo.can_assign, ask: false,
        },
      })));
    } catch (error) {
      this.error.set(serverMessage(error) ?? 'The repositories of the project could not be loaded.');
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

  protected remove(row: RepositoryRow) {
    const data: ConfirmDialogConfig = {
      title: 'Take it out of the project?',
      body: `${row.name} stops being listed for this project. The repository and the credentials assigned to it stay, and a run that ` +
        'uses it again lists it again.',
      yes: 'Take out', no: 'Cancel', iconClass: 'al-ico-alert', iconColor: 'var(--color-warning)', destructive: true,
    };
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(ConfirmDialogComponent, {data, panelClass: 'dialog-sm'})
      .afterClosed().subscribe(async confirmed => {
        if (!confirmed) {
          return;
        }
        this.busy.set(true);
        try {
          await lastValueFrom(this.repositories.unlink(row.repo.id, this.projectId()));
          await this.load();
        } catch (error) {
          this.error.set(serverMessage(error) ?? `${row.name} could not be taken out.`);
        } finally {
          this.busy.set(false);
        }
      });
  }
}
