import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {DatePipe} from '@angular/common';
import {MatIcon} from '@angular/material/icon';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {catchError, of} from 'rxjs';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {RepoHistory, RepoHistoryCommit, RepositoriesService} from '../dataset-git/repositories.service';

/** How many tasks the hover text of a commit lists. */
const TIP_RUNS = 8;

/**
 * The history of a repository that matters to CairnML: the newest commit, every commit a task ran on, the first commit, and a
 * gap with the number of hidden commits between them (see the server's repository_history). Hover a commit to see its tasks;
 * tasks that ran with uncommitted changes are marked.
 */
@Component({
  selector: 'sm-repository-history',
  templateUrl: './repository-history.component.html',
  styleUrls: ['./repository-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatIcon, MatProgressSpinner, TooltipDirective],
})
export class RepositoryHistoryComponent {
  private readonly repositories = inject(RepositoriesService);

  readonly repositoryId = input.required<string>();

  protected readonly history = rxResource<RepoHistory | null, string>({
    params: () => this.repositoryId(),
    stream: ({params}) => this.repositories.history(params).pipe(catchError(() => of(null))),
  });

  protected readonly dirtyCount = (commit: RepoHistoryCommit) => commit.runs.filter(run => run.dirty).length;

  /** The text shown when a commit is hovered: its message, and its tasks one by one. */
  protected readonly commitTip = (commit: RepoHistoryCommit): string => {
    const lines = [commit.message, `${commit.sha.slice(0, 7)} · ${commit.author}`];
    if (commit.runs.length) {
      lines.push('', `${commit.runs.length} ${commit.runs.length === 1 ? 'task ran' : 'tasks ran'} on this commit:`);
      commit.runs.slice(0, TIP_RUNS).forEach(run => lines.push(`• ${run.name} (${run.status})${run.dirty ? ', with uncommitted changes' : ''}`));
      if (commit.runs.length > TIP_RUNS) {
        lines.push(`… and ${commit.runs.length - TIP_RUNS} more`);
      }
    }
    return lines.join('\n');
  };

  protected readonly gapTip = (count: number): string => `${count} ${count === 1 ? 'commit' : 'commits'} in between`;

  protected readonly hasCommits = computed(() => (this.history.value()?.nodes ?? []).length > 0);
}
