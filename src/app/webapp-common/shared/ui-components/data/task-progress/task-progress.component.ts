import {ChangeDetectionStrategy, Component, computed, effect, inject, input} from '@angular/core';
import {TaskProgress, TaskProgressService} from './task-progress.service';

interface ProgressRow {
  main: boolean;
  label: string;
  /** the text on the bar */
  text: string;
  /** null: the bar cannot be filled (no total): it shows the idle animation */
  percent: number | null;
}

/**
 * How far a running task is. One component for every place that shows a running task, in two forms:
 * - `mini`: a small bar with the percentage, for status cells;
 * - `full`: the outermost bar and a bar for each bar inside it, each with its label, counts and percentage centred on it.
 * A running task that has nothing to count right now (it reports nothing, or no bar that counts is running) shows the idle
 * animation instead of a bar. Nothing is shown for a task that is not running.
 */
@Component({
  selector: 'sm-task-progress',
  templateUrl: './task-progress.component.html',
  styleUrls: ['./task-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {'[class]': 'mode()', '[class.visible]': 'running()'}
})
export class TaskProgressComponent {
  private service = inject(TaskProgressService);

  taskId = input.required<string>();
  status = input<string>();
  /** the stored progress (`runtime`) of the task: what is shown until the live value arrives */
  runtime = input<{progress?: string | number; progress_label?: string} | null>();
  mode = input<'mini' | 'full'>('mini');

  protected running = computed(() => this.status() === 'in_progress');
  protected progress = computed<TaskProgress | null>(() => this.running() ? this.service.of(this.taskId(), this.runtime())() : null);
  protected percent = computed(() => this.progress()?.percent ?? null);
  protected idle = computed(() => this.running() && this.percent() === null);
  protected rows = computed<ProgressRow[]>(() => {
    const bars = this.progress()?.bars ?? [];
    if (!bars.length) {
      return [{main: true, label: 'Progress', text: 'Working…', percent: null}];
    }
    return bars.map((bar, index) => {
      const main = index === 0;
      const percent = main ? this.percent() : this.fraction(bar);
      const parts = [bar.label || 'Progress'];
      if (bar.total) {
        parts.push(`${bar.n ?? 0} / ${bar.total}`);
      } else if (bar.n !== undefined && bar.n !== null) {
        parts.push(`${bar.n}`);
      }
      if (main && percent !== null) {
        parts.push(`${percent}%`);
      }
      return {main, label: bar.label || 'Progress', text: parts.join(' · '), percent};
    });
  });

  constructor() {
    effect((onCleanup) => {
      if (this.running()) {
        onCleanup(this.service.watch(this.taskId()));
      }
    });
  }

  private fraction(bar: {n?: number; total?: number}): number | null {
    return bar.total ? Math.round(Math.max(0, Math.min(100, ((bar.n ?? 0) / bar.total) * 100))) : null;
  }
}
