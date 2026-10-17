import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {SplitAreaComponent, SplitComponent} from 'angular-split';
import {PrimeTemplate} from 'primeng/api';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {LabeledRowComponent} from '@common/shared/ui-components/data/labeled-row/labeled-row.component';
import {LineChartComponent, Topic} from '@common/shared/components/charts/line-chart/line-chart.component';
import {pollWhileVisible} from './scheduler-live';
import {SchedulerApiService, SchedulerJobOnWorker, SchedulerUsagePoint, SchedulerWorker} from './scheduler-api.service';
import {GpuBlock, ResourceStat, StatCard, sinceText, stateClass} from './scheduler-view';

const JOB_COLUMNS: ISmCol[] = [
  {id: 'job', header: 'JOB', style: {minWidth: '160px'}},
  {id: 'state', header: 'STATE', style: {width: '100px'}},
  {id: 'cpu', header: 'CPUS', style: {width: '70px'}},
  {id: 'ram', header: 'RAM: PEAK / LIMIT', style: {width: '200px'}},
  {id: 'gpu', header: 'GPUS', style: {width: '70px'}},
  {id: 'mode', header: 'MODE', style: {width: '110px'}},
];

/** The chart's series colours, the same pair the Dashboard tab uses (chart.js takes colours, not CSS tokens). */
const CHART_COLORS = ['#f57e23', '#fbc08f'];

/** How much history the detail chart shows. */
const HISTORY_MINUTES = 60;

/** Share of the page the detail panel takes when a worker is open. */
const DETAIL_SIZE = 45;

const pct = (part: number, whole: number): number => (whole > 0 ? Math.min(100, (100 * part) / whole) : 0);

@Component({
  selector: 'sm-workers-tree',
  templateUrl: './workers-tree.component.html',
  styleUrls: ['./workers-tree.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SplitComponent, SplitAreaComponent, TableComponent, PrimeTemplate, LabeledRowComponent, LineChartComponent,
    MatIconButton, MatIconModule, TooltipDirective,
  ],
})
export class WorkersTreeComponent {
  private api = inject(SchedulerApiService);

  protected readonly jobColumns = JOB_COLUMNS;
  protected readonly chartColors = CHART_COLORS;
  protected readonly detailSize = DETAIL_SIZE;
  protected readonly selectedId = signal<string | null>(null);
  private readonly overview = pollWhileVisible(() => this.api.overview());
  private readonly history = pollWhileVisible(() => this.api.usageHistory(HISTORY_MINUTES));

  protected readonly workers = computed(() => this.overview());
  protected readonly selected = computed(() => this.overview()?.find(w => w.id === this.selectedId()) ?? null);

  // rows need a unique id (the table marks a row selected by its id)
  protected readonly selectedJobs = computed(() => (this.selected()?.jobs ?? []).map(j => ({...j, id: j.task})));

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

  /** CPU load and RAM use of the open worker over the last hour, both as a share of the machine. */
  protected readonly chartData = computed<Topic[]>(() => {
    const worker = this.selected();
    if (!worker) {
      return [];
    }
    const points = (this.history() ?? [])
      .filter((p: SchedulerUsagePoint) => p.kind === 'machine' && p.worker === worker.id)
      .sort((a, b) => a.timestamp - b.timestamp);
    const topic = (id: string, name: string, pick: (p: SchedulerUsagePoint) => number): Topic => ({
      topicID: id,
      topicName: name,
      topic: 0,
      dates: points.map(p => ({value: Math.round(pick(p) * 10) / 10, date: new Date(p.timestamp).toISOString()})),
    });
    return [
      topic('cpu', 'CPU load', p => p.cpu_percent ?? 0),
      topic('ram', 'RAM used', p => pct(p.ram_used_gb ?? 0, worker.capacity.ram_gb)),
    ];
  });

  protected readonly hasHistory = computed(() => (this.chartData()[0]?.dates.length ?? 0) > 1);

  protected select(id: string | null) {
    this.selectedId.update(current => (current === id ? null : id));
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

  protected gpuSummary(w: SchedulerWorker): string {
    const models = [...new Set(w.capacity.gpus.map(g => `${g.model} ${g.memory_gb} GB`))];
    return w.capacity.gpus.length ? `${w.capacity.gpus.length} × ${models.join(', ')}` : 'none';
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
