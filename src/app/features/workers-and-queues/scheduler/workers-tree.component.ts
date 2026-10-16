import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {PrimeTemplate} from 'primeng/api';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {pollWhileVisible} from './scheduler-live';
import {SchedulerApiService, SchedulerJobOnWorker, SchedulerWorker} from './scheduler-api.service';

interface Bar {
  used: number;
  allocated: number;
}

const WORKER_COLUMNS: ISmCol[] = [
  {id: 'worker', header: 'WORKER', style: {width: '240px', minWidth: '180px'}},
  {id: 'state', header: 'STATE', style: {width: '110px'}},
  {id: 'jobs', header: 'JOBS', style: {width: '80px'}},
  {id: 'cpu', header: 'CPU: USED / ALLOCATED', style: {width: '220px'}},
  {id: 'ram', header: 'RAM: USED / ALLOCATED', style: {width: '220px'}},
  {id: 'gpu', header: 'GPU: ALLOCATED', style: {width: '160px'}},
  {id: 'seen', header: 'LAST SEEN', style: {width: '120px'}},
];

const JOB_COLUMNS: ISmCol[] = [
  {id: 'job', header: 'JOB', style: {width: '240px', minWidth: '180px'}},
  {id: 'state', header: 'STATE', style: {width: '110px'}},
  {id: 'cpu', header: 'CPUS', style: {width: '120px'}},
  {id: 'ram', header: 'RAM: PEAK / LIMIT', style: {width: '220px'}},
  {id: 'gpu', header: 'GPUS', style: {width: '120px'}},
  {id: 'exclusive', header: 'MODE', style: {width: '140px'}},
];

const pct = (part: number, whole: number): number => (whole > 0 ? Math.min(100, (100 * part) / whole) : 0);

@Component({
  selector: 'sm-workers-tree',
  templateUrl: './workers-tree.component.html',
  styleUrls: ['./workers-tree.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TableComponent, PrimeTemplate, MatProgressBarModule, DecimalPipe],
})
export class WorkersTreeComponent {
  private api = inject(SchedulerApiService);

  protected readonly workerColumns = WORKER_COLUMNS;
  protected readonly jobColumns = JOB_COLUMNS;
  protected readonly expanded = signal<Record<string, boolean>>({});
  private readonly overview = pollWhileVisible(() => this.api.overview());
  // rows need a unique id (the table marks a row selected by its id); the jobs of a worker get theirs too
  protected readonly workers = computed(() => this.overview()?.map(w => ({
    ...w,
    id: w.id,
    jobs: w.jobs.map(j => ({...j, id: j.task})),
  })) ?? null);
  protected readonly empty = computed(() => {
    const workers = this.workers();
    return workers !== null && workers.length === 0;
  });

  protected setExpanded(id: string, value: boolean) {
    this.expanded.update(current => ({...current, [id]: value}));
  }

  protected schedulableCpus(w: SchedulerWorker): number {
    return Math.max(1, w.capacity.cpus - w.reserved.cpus);
  }

  protected allocatedCpus(w: SchedulerWorker): number {
    return w.jobs.reduce((sum, j) => sum + j.cpus.length, 0);
  }

  protected cpuBar(w: SchedulerWorker): Bar {
    return {used: w.usage?.cpu_percent ?? 0, allocated: pct(this.allocatedCpus(w), this.schedulableCpus(w))};
  }

  protected ramBar(w: SchedulerWorker): Bar {
    const allocated = w.jobs.reduce((sum, j) => sum + (j.ram_gb ?? 0), 0);
    const used = w.usage?.ram_used_gb ?? 0;
    return {used: pct(used, w.capacity.ram_gb), allocated: pct(allocated, w.capacity.ram_gb)};
  }

  protected gpuAllocated(w: SchedulerWorker): string {
    const allocated = w.jobs.reduce((sum, j) => sum + j.gpus.length, 0);
    return `${allocated} / ${w.capacity.gpus.length}`;
  }

  protected seen(w: SchedulerWorker): string {
    if (!w.last_sync) {
      return '–';
    }
    const seconds = Math.max(0, Math.round((Date.now() - Date.parse(w.last_sync)) / 1000));
    return seconds < 60 ? `${seconds} s ago` : `${Math.round(seconds / 60)} min ago`;
  }

  protected jobRam(j: SchedulerJobOnWorker): Bar {
    return {used: pct(j.usage?.peak_ram_gb ?? j.usage?.ram_gb ?? 0, j.ram_gb), allocated: 100};
  }

  protected mode(j: SchedulerJobOnWorker): string {
    return j.exclusive ? 'whole machine' : 'shared';
  }
}
