import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {pollWhileVisible} from './scheduler-live';
import {SchedulerApiService, SchedulerJobOnWorker, SchedulerWorker} from './scheduler-api.service';
import {GpuBlock, ResourceStat, StatCard, sinceText, stateClass} from './scheduler-view';

const pct = (part: number, whole: number): number => (whole > 0 ? Math.min(100, (100 * part) / whole) : 0);

@Component({
  selector: 'sm-workers-tree',
  templateUrl: './workers-tree.component.html',
  styleUrls: ['./workers-tree.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, TooltipDirective],
})
export class WorkersTreeComponent {
  private api = inject(SchedulerApiService);

  protected readonly expanded = signal<Record<string, boolean>>({});
  private readonly overview = pollWhileVisible(() => this.api.overview());

  // rows need a unique id (the table marks a row selected by its id)
  protected readonly workers = computed(() => this.overview()?.map(w => ({
    ...w,
    jobs: w.jobs.map(j => ({...j, id: j.task})),
  })) ?? null);

  protected readonly stats = computed<StatCard[]>(() => {
    const workers = this.overview() ?? [];
    const active = workers.filter(w => w.state === 'active').length;
    const jobs = workers.reduce((sum, w) => sum + w.jobs.length, 0);
    // a lost machine cannot take jobs, so its capacity is not counted
    const live = workers.filter(w => w.state !== 'lost');
    const cpuAllocated = live.reduce((sum, w) => sum + this.allocatedCpus(w), 0);
    const cpuSchedulable = live.reduce((sum, w) => sum + this.schedulableCpus(w), 0);
    const gpuAllocated = live.reduce((sum, w) => sum + this.gpuAllocated(w), 0);
    const gpuTotal = live.reduce((sum, w) => sum + w.capacity.gpus.length, 0);
    return [
      {label: 'WORKERS', value: `${active}`, caption: `active of ${workers.length} registered`},
      {label: 'RUNNING JOBS', value: `${jobs}`, caption: jobs === 1 ? '1 job on a machine' : `${jobs} jobs on machines`},
      {label: 'CPUS ALLOCATED', value: `${cpuAllocated}`, caption: `of ${cpuSchedulable} schedulable`},
      {label: 'GPUS ALLOCATED', value: `${gpuAllocated}`, caption: `of ${gpuTotal} available`},
    ];
  });

  protected setExpanded(id: string, value: boolean) {
    this.expanded.update(current => ({...current, [id]: value}));
  }

  protected isExpanded(id: string): boolean {
    return !!this.expanded()[id];
  }

  protected stateClass = stateClass;
  protected sinceText = sinceText;

  protected schedulableCpus(w: SchedulerWorker): number {
    return Math.max(1, w.capacity.cpus - w.reserved.cpus);
  }

  protected allocatedCpus(w: SchedulerWorker): number {
    return w.jobs.reduce((sum, j) => sum + j.cpus.length, 0);
  }

  protected gpuAllocated(w: SchedulerWorker): number {
    return w.jobs.reduce((sum, j) => sum + j.gpus.length, 0);
  }

  protected cpuStat(w: SchedulerWorker): ResourceStat {
    return {
      label: 'CPU',
      used: pct(w.usage?.cpu_percent ?? 0, 100),
      allocated: pct(this.allocatedCpus(w), this.schedulableCpus(w)),
      caption: `${Math.round(w.usage?.cpu_percent ?? 0)}% used · ${this.allocatedCpus(w)} of ${this.schedulableCpus(w)} allocated`,
    };
  }

  protected ramStat(w: SchedulerWorker): ResourceStat {
    const allocated = w.jobs.reduce((sum, j) => sum + (j.ram_gb ?? 0), 0);
    const used = w.usage?.ram_used_gb ?? 0;
    return {
      label: 'RAM',
      used: pct(used, w.capacity.ram_gb),
      allocated: pct(allocated, w.capacity.ram_gb),
      caption: `${used.toFixed(1)} of ${w.capacity.ram_gb.toFixed(1)} GB used · ${allocated.toFixed(1)} GB allocated`,
    };
  }

  /** One block per GPU: lit when a job holds it, so you see which GPU is free at a glance. */
  protected gpuBlocks(w: SchedulerWorker): GpuBlock[] {
    const held = new Set(w.jobs.flatMap(j => j.gpus));
    return w.capacity.gpus.map(gpu => ({
      index: gpu.index,
      label: `GPU ${gpu.index} · ${gpu.model} · ${gpu.memory_gb} GB`,
      busy: held.has(gpu.index),
    }));
  }

  protected jobRam(j: SchedulerJobOnWorker): ResourceStat {
    const peak = j.usage?.peak_ram_gb ?? j.usage?.ram_gb;
    return {
      label: 'RAM',
      used: pct(peak ?? 0, j.ram_gb),
      allocated: 100,
      caption: peak !== undefined ? `${peak.toFixed(1)} / ${j.ram_gb.toFixed(1)} GB` : `limit ${j.ram_gb.toFixed(1)} GB`,
    };
  }

  protected mode(j: SchedulerJobOnWorker): string {
    return j.exclusive ? 'whole machine' : 'shared';
  }
}
