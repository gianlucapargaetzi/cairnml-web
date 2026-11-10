import {computed, effect, inject, Injectable, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Store} from '@ngrx/store';
import {selectAppVisible} from '@common/core/reducers/view.reducer';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {TasksProgress} from '~/business-logic/model/tasks/tasksGetProgressResponse';

/** How often the progress of the running tasks that are on screen is asked for. The task lists refresh every 10 s. */
export const PROGRESS_POLL_INTERVAL = 2000;
const BATCH = 100;

/**
 * The progress stored with the task. The SDK stores 0 without a label when it creates a task: that is no progress,
 * so such a task is idle until it reports.
 */
function storedPercent(runtime?: {progress?: string | number; progress_label?: string} | null): number | null {
  if (runtime?.progress === undefined || runtime?.progress === '') {
    return null;
  }
  const stored = Number(runtime.progress);
  return Number.isNaN(stored) || (stored === 0 && !runtime.progress_label) ? null : stored;
}

export interface TaskProgress {
  /** 0-100, null while no bar of the run has a known total */
  percent: number | null;
  /** the outermost bar first, then the bars inside it */
  bars: {label?: string; n?: number; total?: number}[];
}

/**
 * The live progress of running tasks. Whatever shows a running task asks for its id with `watch`; the service asks the
 * server for all watched tasks at once, every two seconds, and only while the page is visible.
 */
@Injectable({providedIn: 'root'})
export class TaskProgressService {
  private api = inject(ApiTasksService);
  private visible = toSignal(inject(Store).select(selectAppVisible), {initialValue: true});
  private watched = new Map<string, number>();
  private watchedCount = signal(0);
  private live = signal<Record<string, TaskProgress>>({});
  private timer: ReturnType<typeof setInterval> | null = null;
  private busy = false;

  constructor() {
    effect(() => {
      const poll = this.visible() && this.watchedCount() > 0;
      if (poll && !this.timer) {
        this.fetch();
        this.timer = setInterval(() => this.fetch(), PROGRESS_POLL_INTERVAL);
      } else if (!poll && this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    });
  }

  /** Start asking for this task. Returns the function that stops it. */
  watch(taskId: string): () => void {
    this.watched.set(taskId, (this.watched.get(taskId) ?? 0) + 1);
    this.watchedCount.set(this.watched.size);
    return () => {
      const count = (this.watched.get(taskId) ?? 1) - 1;
      if (count > 0) {
        this.watched.set(taskId, count);
      } else {
        this.watched.delete(taskId);
        this.live.update(values => {
          const {[taskId]: _, ...rest} = values;
          return rest;
        });
      }
      this.watchedCount.set(this.watched.size);
    };
  }

  /** Just the percentage, for places that only need a number (the ring of a status label) */
  percent(taskId: string, runtime?: {progress?: string | number; progress_label?: string} | null): number | null {
    const live = this.live()[taskId];
    if (live) {
      return live.percent;
    }
    return storedPercent(runtime);
  }

  /** The progress of the task: the live one if it is reporting, otherwise what the database has (`runtime`) */
  of(taskId: string, runtime?: {progress?: string | number; progress_label?: string} | null) {
    return computed((): TaskProgress | null => {
      const live = this.live()[taskId];
      if (live) {
        return live;
      }
      const stored = storedPercent(runtime);
      return stored === null ? null : {
        percent: stored,
        bars: runtime?.progress_label ? [{label: runtime.progress_label}] : []
      };
    });
  }

  private fetch() {
    if (this.busy || this.watched.size === 0) {
      return;
    }
    this.busy = true;
    const ids = [...this.watched.keys()];
    const batches: string[][] = [];
    for (let i = 0; i < ids.length; i += BATCH) {
      batches.push(ids.slice(i, i + BATCH));
    }
    let pending = batches.length;
    const result: Record<string, TaskProgress> = {};
    const done = () => {
      if (--pending === 0) {
        this.busy = false;
        this.live.set(result);
      }
    };
    batches.forEach(tasks => this.api.tasksGetProgress({tasks}).subscribe({
      next: response => {
        Object.entries(response?.progress ?? {}).forEach(([id, value]: [string, TasksProgress]) => {
          result[id] = {percent: value.percent ?? null, bars: value.bars ?? []};
        });
        done();
      },
      error: () => done()
    }));
  }
}
