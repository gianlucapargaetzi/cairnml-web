import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {PrimeTemplate} from 'primeng/api';
import {LineChartComponent, Topic} from '@common/shared/components/charts/line-chart/line-chart.component';
import {pollWhileVisible} from './monitor-live';
import {MonitorApiService, SchedulerEvent, SchedulerUsagePoint, SchedulerWorker} from './monitor-api.service';

export interface ResourceUsage {
  used: number;
  total: number;
}

/** One machine (worker) as a resource group. */
export interface ResourceGroup {
  name: string;
  workers: ResourceUsage;
  gpus: ResourceUsage;
  cpus: ResourceUsage;
  cpuLoad: number;
  ramFreeGb: number;
  freeDiskPercent: number;
  alert?: string;
}

const TIME_RANGES = [
  {label: 'Last hour', hours: 1},
  {label: 'Last 3 hours', hours: 3},
  {label: 'Last 12 hours', hours: 12},
  {label: 'Last 24 hours', hours: 24},
];

const CHART_COLORS = ['#f57e23', '#fbc08f'];

const EVENT_TONES: Record<string, string> = {
  worker_registered: 'ok', worker_back: 'ok', claimed: 'ok', released: 'ok', placed: 'idle',
  worker_lost: 'error', failed: 'error', retried: 'error', cancelled: 'idle',
  drained: 'idle', resumed: 'ok', priority_changed: 'idle',
};

function groupOf(w: SchedulerWorker): ResourceGroup {
  const allocatedCpus = w.jobs.reduce((sum, j) => sum + j.cpus.length, 0);
  const allocatedGpus = w.jobs.reduce((sum, j) => sum + j.gpus.length, 0);
  const schedulableCpus = Math.max(1, w.capacity.cpus - w.reserved.cpus);
  const ramUsed = w.usage?.ram_used_gb ?? 0;
  const diskUsed = w.usage?.disk_used_percent ?? 0;
  const alert = w.state === 'lost' ? 'Worker lost' : w.state === 'draining' ? 'Draining' : undefined;
  return {
    name: w.id,
    workers: {used: w.state === 'active' ? 1 : 0, total: 1},
    gpus: {used: allocatedGpus, total: w.capacity.gpus.length},
    cpus: {used: allocatedCpus, total: schedulableCpus},
    cpuLoad: Math.round(w.usage?.cpu_percent ?? 0),
    ramFreeGb: Math.max(0, Math.round((w.capacity.ram_gb - ramUsed) * 10) / 10),
    freeDiskPercent: Math.round(100 - diskUsed),
    alert,
  };
}

/** The machine samples, summed per minute: CPUs in use and CPUs idle, across all machines. */
function cpuTopics(points: SchedulerUsagePoint[], cpusByWorker: Map<string, number>): Topic[] {
  const buckets = new Map<number, { inUse: number; total: number }>();
  for (const p of points) {
    if (p.kind !== 'machine') {
      continue;
    }
    const minute = Math.floor(p.timestamp / 60000) * 60000;
    const cpus = cpusByWorker.get(p.worker) ?? 0;
    const bucket = buckets.get(minute) ?? {inUse: 0, total: 0};
    bucket.inUse += ((p.cpu_percent ?? 0) / 100) * cpus;
    bucket.total += cpus;
    buckets.set(minute, bucket);
  }
  const times = [...buckets.keys()].sort((a, b) => a - b);
  const topic = (id: string, name: string, pick: (b: { inUse: number; total: number }) => number): Topic => ({
    topicID: id,
    topicName: name,
    topic: 0,
    dates: times.map(t => ({value: pick(buckets.get(t)!), date: new Date(t).toISOString()})),
  });
  return [
    topic('cpu', 'CPUs in use', b => Math.round(b.inUse * 10) / 10),
    topic('cpu-idle', 'CPUs idle', b => Math.round((b.total - b.inUse) * 10) / 10),
  ];
}

@Component({
  selector: 'sm-resources-dashboard',
  templateUrl: './resources-dashboard.component.html',
  styleUrls: ['./resources-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressBarModule,
    TableComponent,
    PrimeTemplate,
    LineChartComponent,
  ]
})
export class ResourcesDashboardComponent {
  private api = inject(MonitorApiService);

  protected readonly timeRanges = TIME_RANGES;
  protected readonly chartColors = CHART_COLORS;
  protected readonly timeRange = signal(3);

  private readonly overview = pollWhileVisible(() => this.api.overview());
  private readonly eventList = pollWhileVisible(() => this.api.events(20));
  private readonly history = pollWhileVisible(() => this.api.usageHistory(this.timeRange() * 60));

  protected readonly groups = computed<ResourceGroup[]>(() => (this.overview() ?? []).map(groupOf));

  protected readonly events = computed(() => (this.eventList() ?? []).map((e: SchedulerEvent) => ({
    time: new Date(e.time).toLocaleTimeString(),
    text: [e.worker, e.task, e.kind.replace(/_/g, ' '), e.detail].filter(Boolean).join(' · '),
    tone: EVENT_TONES[e.kind] ?? 'idle',
  })));

  protected totals = computed(() => {
    const sum = (pick: (g: ResourceGroup) => ResourceUsage) =>
      this.groups().reduce((acc, g) => ({used: acc.used + pick(g).used, total: acc.total + pick(g).total}), {used: 0, total: 0});
    return {workers: sum(g => g.workers), gpus: sum(g => g.gpus), cpus: sum(g => g.cpus)};
  });

  protected chartData = computed<Topic[]>(() => {
    const cpus = new Map((this.overview() ?? []).map(w => [w.id, Math.max(0, w.capacity.cpus - w.reserved.cpus)]));
    return cpuTopics(this.history() ?? [], cpus);
  });

  protected readonly columns = [
    {id: 'name', header: 'NAME', style: {width: '260px', minWidth: '200px'}},
    {id: 'workers', header: 'WORKER COUNT', style: {width: '130px'}},
    {id: 'gpuUtil', header: 'GPUS ALLOCATED (%)', style: {width: '150px'}},
    {id: 'cpuLoad', header: 'CPU LOAD (%)', style: {width: '150px'}},
    {id: 'ramFree', header: 'RAM FREE (GB)', style: {width: '130px'}},
    {id: 'disk', header: 'FREE HOME DISK (%)', style: {width: '150px'}},
    {id: 'network', header: 'NETWORK TX/RX (MBPS)', style: {width: '180px'}},
  ] as ISmCol[];

  protected percent(usage: ResourceUsage): number {
    return usage.total ? Math.round((usage.used / usage.total) * 100) : 0;
  }

  protected barClass(percent: number): string {
    return percent >= 100 ? 'full' : percent >= 90 ? 'high' : '';
  }

  // The shared table marks a row as selected by comparing ids, so every row needs one.
  protected tableRows = computed(() => this.groups().map(g => ({
    ...g,
    id: g.name,
    workerCount: `${g.workers.used}`,
    gpuUtil: `${this.percent(g.gpus)}`,
    cpuLoadText: `${g.cpuLoad}`,
    ramFreeText: `${g.ramFreeGb}`,
    diskText: `${g.freeDiskPercent}`,
    // network is not measured yet
    network: '–',
  })));

  protected setTimeRange(hours: number) {
    this.timeRange.set(hours);
  }
}
