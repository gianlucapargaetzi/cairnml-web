import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {DatePipe} from '@angular/common';
import {MatIcon} from '@angular/material/icon';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {catchError, of} from 'rxjs';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {presetColors} from '@common/shared/ui-components/inputs/color-picker/color-picker-wrapper.component';
import {RepoHistory, RepoHistoryCommit, RepoHistoryLanes, RepositoriesService} from '../dataset-git/repositories.service';

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

  /** The width of one lane of the rail, in the units of the rail's drawing; the real width is a spacing token. */
  protected readonly laneUnit = 16;

  protected readonly laneColor = (lane: number): string => presetColors[lane % presetColors.length];

  /** The lines of the rail in one row, in a drawing 100 units high: the lanes that pass through, the lanes that end in the row's
   *  commit, and the lines to its parents. */
  protected readonly segments = (node: RepoHistoryLanes, lanes: number) => {
    const x = (lane: number) => lane * this.laneUnit + this.laneUnit / 2;
    const lines: {x1: number; y1: number; x2: number; y2: number; color: string}[] = [];
    for (let lane = 0; lane < lanes; lane++) {
      if (lane === node.lane) {
        if (node.lanes_before[lane]) {
          lines.push({x1: x(lane), y1: 0, x2: x(lane), y2: 50, color: this.laneColor(lane)});
        }
      } else if (node.merge_from.includes(lane)) {
        lines.push({x1: x(lane), y1: 0, x2: x(node.lane), y2: 50, color: this.laneColor(lane)});
      } else if (node.lanes_before[lane] && node.lanes_after[lane]) {
        lines.push({x1: x(lane), y1: 0, x2: x(lane), y2: 100, color: this.laneColor(lane)});
      }
    }
    for (const parent of node.parent_lanes) {
      lines.push({x1: x(node.lane), y1: 50, x2: x(parent), y2: 100, color: this.laneColor(parent)});
    }
    return lines;
  };

  protected readonly hasCommits = computed(() => (this.history.value()?.nodes ?? []).length > 0);
}
