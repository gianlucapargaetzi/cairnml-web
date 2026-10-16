import {ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Store} from '@ngrx/store';
import {getTaskForEnqueue, setTaskForEnqueue} from './select-queue.actions';
import {selectQueueFeature} from './select-queue.reducer';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {splitLine} from '@common/shared/utils/shared-utils';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {SlicePipe} from '@angular/common';

export interface SelectQueueDialogData {
  taskIds?: string[];
  reference?: string;
  retryMode?: boolean;
}

@Component({
  selector: 'sm-select-queue',
  templateUrl: './select-queue.component.html',
  styleUrls: ['./select-queue.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogTemplateComponent,
    TooltipDirective,
    MatFormField,
    MatInput,
    ReactiveFormsModule,
    MatButton,
    SlicePipe,
    MatLabel
  ]
})
export class SelectQueueComponent {
  private store = inject(Store);
  public dialogRef = inject<MatDialogRef<ConfirmDialogComponent>>(MatDialogRef<ConfirmDialogComponent>);
  private destroy = inject(DestroyRef);
  protected data = inject<SelectQueueDialogData>(MAT_DIALOG_DATA);

  public enqueueWarning = computed(() =>
    this.tasksForEnqueue()?.some(task => !(task && task.script && (task.script.diff || (task.script.repository && task.script.entry_point)))));
  // What the task needs from a machine: the whole machine, or the amounts named here (all of them, or none)
  public computeMode = new FormControl<'whole' | 'specify'>('whole', {nonNullable: true});
  public cpusControl = new FormControl<number | null>(null);
  public ramControl = new FormControl<number | null>(null);
  public gpusControl = new FormControl<number | null>(0);
  public gpuMemoryControl = new FormControl<number | null>(0);
  public diskControl = new FormControl<number | null>(null);
  public runtimeControl = new FormControl<number | null>(null);
  public priorityControl = new FormControl<number>(50, {nonNullable: true, validators: [Validators.min(0), Validators.max(100), Validators.required]});
  public specifyValid(): boolean {
    return this.computeMode.value !== 'specify' || (
      this.cpusControl.value !== null && this.cpusControl.value >= 1 &&
      this.ramControl.value !== null && this.ramControl.value > 0 &&
      this.gpusControl.value !== null && this.gpusControl.value >= 0 &&
      this.diskControl.value !== null && this.diskControl.value >= 0
    );
  }
  split = splitLine;
  public reference = signal(this.data.taskIds.length < 2 ? this.data.reference : `${this.data.taskIds.length} tasks `);
  public tasksForEnqueue = this.store.selectSignal(selectQueueFeature.selectTasks);

  constructor() {
    if (this.data?.taskIds?.length > 0) {
      this.store.dispatch(getTaskForEnqueue({taskIds: this.data.taskIds}));
    }

    this.destroy.onDestroy(() => {
      this.store.dispatch(setTaskForEnqueue({tasks: null}));
    });
  }

  closeDialog(confirmed) {
    this.dialogRef.close({
      confirmed,
      requirements: confirmed && this.computeMode.value === 'specify' ? this.requirementsFromForm() : null,
      priority: this.priorityControl.value,
    });
  }

  /** The requirements the server takes: all of cpus, ram_gb, gpus and disk_gb, plus an optional run-time limit. */
  private requirementsFromForm() {
    const requirements: Record<string, unknown> = {
      cpus: Number(this.cpusControl.value),
      ram_gb: Number(this.ramControl.value),
      gpus: {count: Number(this.gpusControl.value ?? 0), min_memory_gb: Number(this.gpuMemoryControl.value ?? 0), model: null},
      disk_gb: Number(this.diskControl.value),
    };
    if (this.runtimeControl.value) {
      requirements.max_runtime_min = Number(this.runtimeControl.value);
    }
    return requirements;
  }
}
