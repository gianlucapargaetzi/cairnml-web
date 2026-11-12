import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {DatePipe} from '@angular/common';
import {MatIcon} from '@angular/material/icon';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {catchError, of} from 'rxjs';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {presetColors} from '@common/shared/ui-components/inputs/color-picker/color-picker-wrapper.component';
import {RepoHistory, RepoHistoryCommit, RepoHistoryNode, RepositoriesService} from '../dataset-git/repositories.service';

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

  /**
   * The lines of the rail, one curve from every commit to each of its parents, in one drawing that is as high as the list (one
   * unit a row). A line leaves its commit on that commit's own lane and changes lane in one smooth curve right next to the commit
   * on the lower lane (the left one): below the branch's commit when the parent is to the right, above the parent when the child is.
   * A line that leaves the window runs off the bottom.
   */
  protected readonly paths = (nodes: RepoHistoryNode[]) => {
    const unit = this.laneUnit;
    const x = (lane: number) => lane * unit + unit / 2;
    const lines: {d: string; color: string; dashed: boolean}[] = [];
    nodes.forEach((node, row) => {
      const y1 = row + 0.5;
      node.parent_rows.forEach(parentRow => {
        if (parentRow < 0) {
          lines.push({d: `M ${x(node.lane)} ${y1} V ${nodes.length}`, color: this.laneColor(node.lane), dashed: true});
          return;
        }
        const parent = nodes[parentRow];
        const y2 = parentRow + 0.5;
        const x1 = x(node.lane);
        const x2 = x(parent.lane);
        const span = Math.min(1, y2 - y1);
        const half = span / 2;
        let d: string;
        if (node.lane === parent.lane) {
          d = `M ${x1} ${y1} V ${y2}`;
        } else if (parent.lane > node.lane) {
          d = `M ${x1} ${y1} C ${x1} ${y1 + half} ${x2} ${y1 + half} ${x2} ${y1 + span} V ${y2}`;
        } else {
          d = `M ${x1} ${y1} V ${y2 - span} C ${x1} ${y2 - half} ${x2} ${y2 - half} ${x2} ${y2}`;
        }
        lines.push({d, color: this.laneColor(Math.max(node.lane, parent.lane)), dashed: node.type === 'gap' || parent.type === 'gap'});
      });
    });
    return lines;
  };

  protected readonly hasCommits = computed(() => (this.history.value()?.nodes ?? []).length > 0);
}
