import {EntityChipComponent} from '@common/shared/ui-components/tags/entity-chip/entity-chip.component';
import {ChangeDetectionStrategy, Component, computed, inject, input, signal} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {of} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {SectionHeaderComponent} from '@common/shared/components/section-header/section-header.component';
import {RepoAccessBadgeComponent} from '@common/shared/ui-components/data/repo-access-badge/repo-access-badge.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {RepoAccess, RepoAccessService} from '@common/shared/services/repo-access.service';
import {assignCredentials} from '../dataset-credential-dialog/assign-credentials';
import {RepositoriesService} from './repositories.service';
import {datasetsOfHyperparams, RawDatasetTask} from './dataset-git.model';

// The datasets a task used, from the Datasets parameters it recorded, under the source code on the Execution tab. Each one
// links to its entry on the Datasets page and shows how the task's project reads its repository, with the assignment of a
// credential for the one who may (the same rows and rights as the Repositories tab).
@Component({
  selector: 'sm-task-datasets',
  templateUrl: './task-datasets.component.html',
  styleUrls: ['./task-datasets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EntityChipComponent, SectionHeaderComponent, RepoAccessBadgeComponent, TooltipDirective, MatIcon, MatIconButton],
})
export class TaskDatasetsComponent {
  private repoAccess = inject(RepoAccessService);
  private access = inject(RepositoriesService);
  private dialog = inject(MatDialog);

  hyperparams = input<RawDatasetTask['hyperparams']>();
  taskId = input<string | null>(null);

  groups = computed(() => datasetsOfHyperparams(this.hyperparams()));

  private readonly reloads = signal(0);
  private readonly rows = rxResource<RepoAccess[], {task: string | null; reloads: number; count: number}>({
    params: () => ({task: this.taskId(), reloads: this.reloads(), count: this.groups().length}),
    stream: ({params}) => params.task && params.count ? this.repoAccess.requirement([params.task]) : of([] as RepoAccess[]),
  });

  // the access row of a dataset repository: the rows are keyed by the https address, in lower case
  protected accessOf(repo: string): RepoAccess | null {
    const wanted = repo.toLowerCase().replace(/^https?:\/\//, '').replace(/\.git$/, '').replace(/^github\.com\//, '');
    return (this.rows.value() ?? []).find(row => (row.kinds ?? []).includes('dataset') &&
      row.url.toLowerCase().replace(/^https?:\/\//, '').replace(/^github\.com\//, '') === wanted) ?? null;
  }

  protected assign(row: RepoAccess): void {
    assignCredentials(this.dialog, this.access, row).subscribe(saved => saved && this.reloads.update(n => n + 1));
  }
}
