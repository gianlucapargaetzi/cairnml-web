import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {PrimeTemplate} from 'primeng/api';
import {LineChartComponent, Topic} from '@common/shared/components/charts/line-chart/line-chart.component';
import {RESOURCE_GROUPS, EVENT_LOG, ResourceGroup, ResourceUsage} from './resources-dashboard.mock';

const TIME_RANGES = [
  {label: 'Last hour', hours: 1},
  {label: 'Last 3 hours', hours: 3},
  {label: 'Last 12 hours', hours: 12},
  {label: 'Last 24 hours', hours: 24},
];

const CHART_COLORS = ['#f57e23', '#fbc08f', '#4d8dff', '#a5c9ff'];

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
  protected readonly timeRanges = TIME_RANGES;
  protected readonly chartColors = CHART_COLORS;
  protected readonly events = EVENT_LOG;

  protected groups = signal<ResourceGroup[]>(RESOURCE_GROUPS);
  protected timeRange = signal(3);

  protected totals = computed(() => {
    const sum = (pick: (g: ResourceGroup) => ResourceUsage) =>
      this.groups().reduce((acc, g) => ({used: acc.used + pick(g).used, total: acc.total + pick(g).total}), {used: 0, total: 0});
    return {workers: sum(g => g.workers), gpus: sum(g => g.gpus), cpus: sum(g => g.cpus)};
  });

  protected chartData = computed<Topic[]>(() => seriesFor(this.timeRange()));

  protected readonly columns = [
    {id: 'name', header: 'NAME', style: {width: '260px', minWidth: '200px'}},
    {id: 'workers', header: 'WORKER COUNT', style: {width: '130px'}},
    {id: 'gpuUtil', header: 'AVG GPU UTIL (%)', style: {width: '150px'}},
    {id: 'cpuLoad', header: 'AVG CPU LOAD (%)', style: {width: '150px'}},
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
    network: `${g.networkTx.toFixed(2)} / ${g.networkRx.toFixed(2)}`,
  })));

  protected setTimeRange(hours: number) {
    this.timeRange.set(hours);
  }
}

// Sample series for the chart: CPU and GPU in use and idle, one point every five minutes.
// A point's value is the metric, its date is the time it was taken.
function seriesFor(hours: number): Topic[] {
  const points = hours * 12;
  const now = Date.now();
  const times = Array.from({length: points}, (_, i) => now - (points - 1 - i) * 5 * 60 * 1000);
  const busy = (i: number) => i > points * 0.35 && i < points * 0.6;
  const build = (id: string, name: string, metric: (i: number) => number): Topic => ({
    topicID: id,
    topicName: name,
    topic: 0,
    dates: times.map((t, i) => ({value: metric(i), date: new Date(t).toISOString()})),
  });
  return [
    build('cpu', 'CPU in use', i => 2050 + Math.sin(i / 7) * 40 - (busy(i) ? 900 : 0)),
    build('cpu-idle', 'CPU idle', i => 160 + Math.sin(i / 5) * 12 - (busy(i) ? 40 : 0)),
    build('gpu', 'GPU in use', i => (2050 + Math.sin(i / 7) * 40 - (busy(i) ? 900 : 0)) / 13 + 10),
    build('gpu-idle', 'GPU idle', i => 20 + Math.sin(i / 9) * 4),
  ];
}
