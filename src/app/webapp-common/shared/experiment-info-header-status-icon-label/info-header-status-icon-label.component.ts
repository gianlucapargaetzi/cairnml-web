import {ChangeDetectionStrategy, Component, computed, effect, inject, input} from '@angular/core';
import {TaskProgressService} from '@common/shared/ui-components/data/task-progress/task-progress.service';
import {EXPERIMENTS_STATUS_LABELS} from '~/features/experiments/shared/experiments.const';
import {UpperCasePipe} from '@angular/common';

@Component({
  selector: 'sm-info-header-status-icon-label',
  templateUrl: './info-header-status-icon-label.component.html',
  styleUrls: ['./info-header-status-icon-label.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    UpperCasePipe
  ]
})
export class InfoHeaderStatusIconLabelComponent {
  showLabel = input(true);
  status = input('');
  /** the task: when it is running and reports progress, the strip fills up to it */
  taskId = input<string>();
  runtime = input<{progress?: string | number} | null>();

  private progressService = inject(TaskProgressService);
  protected running = computed(() => this.status() === 'in_progress' && !!this.taskId());
  protected percent = computed(() => this.running() ? this.progressService.percent(this.taskId(), this.runtime()) : null);

  constructor() {
    effect((onCleanup) => {
      if (this.running()) {
        onCleanup(this.progressService.watch(this.taskId()));
      }
    });
  }

  protected readonly experimentsStatusLabels = EXPERIMENTS_STATUS_LABELS;
}
