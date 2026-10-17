import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {PrimeTemplate} from 'primeng/api';
import {ColHeaderTypeEnum, ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {ButtonToggleComponent} from '@common/shared/ui-components/inputs/button-toggle/button-toggle.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {pollWhileVisible} from './scheduler-live';
import {SchedulerApiService, SchedulerEvent, SchedulerJob} from './scheduler-api.service';
import {StatCard, sinceText, stateClass} from './scheduler-view';

// The same header treatment as the experiments and dashboard tables: plain titles, no custom borders.
const JOB_COLUMNS: ISmCol[] = [
  {id: 'job', headerType: ColHeaderTypeEnum.title, header: 'JOB', style: {minWidth: '220px'}, disableDrag: true},
  {id: 'state', headerType: ColHeaderTypeEnum.title, header: 'STATE', style: {width: '120px'}, disableDrag: true},
  {id: 'priority', headerType: ColHeaderTypeEnum.title, header: 'PRIORITY', style: {width: '100px'}, disableDrag: true},
  {id: 'needs', headerType: ColHeaderTypeEnum.title, header: 'NEEDS', style: {width: '340px'}, disableDrag: true},
  {id: 'where', headerType: ColHeaderTypeEnum.title, header: 'WHERE / WHY WAITING', style: {minWidth: '240px'}, disableDrag: true},
  {id: 'since', headerType: ColHeaderTypeEnum.title, header: 'SINCE', style: {width: '130px'}, disableDrag: true},
];

type Filter = 'all' | 'running' | 'pending';

@Component({
  selector: 'sm-jobs-list',
  templateUrl: './jobs-list.component.html',
  styleUrls: ['./jobs-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PrimeTemplate, TableComponent, ButtonToggleComponent, TooltipDirective],
})
export class JobsListComponent {
  private api = inject(SchedulerApiService);

  protected readonly columns = JOB_COLUMNS;
  protected readonly filter = signal<Filter>('all');
  protected readonly jobs = pollWhileVisible(() => this.api.jobs());
  protected readonly events = pollWhileVisible(() => this.api.events(30));

  // rows need a unique id (the table marks a row selected by its id)
  protected readonly all = computed(() => (this.jobs() ?? []).map(j => ({...j, id: j.task})));
  protected readonly running = computed(() => this.all().filter(j => j.state === 'running'));
  protected readonly pending = computed(() => this.all().filter(j => j.state === 'pending'));
  protected readonly shown = computed(() => {
    const wanted = this.filter();
    return wanted === 'all' ? this.all() : wanted === 'running' ? this.running() : this.pending();
  });

  protected readonly filterOptions = computed(() => [
    {value: 'all' as Filter, label: `All · ${this.all().length}`},
    {value: 'running' as Filter, label: `Running · ${this.running().length}`},
    {value: 'pending' as Filter, label: `Waiting · ${this.pending().length}`},
  ]);

  protected readonly stats = computed<StatCard[]>(() => {
    const longest = this.pending().reduce<number | null>((oldest, j) => {
      const t = j.since ? Date.parse(j.since) : null;
      return t === null ? oldest : oldest === null ? t : Math.min(oldest, t);
    }, null);
    const gpus = this.running().reduce((sum, j) => sum + (j.gpus?.length ?? j.requirements?.gpus.count ?? 0), 0);
    return [
      {label: 'RUNNING', value: `${this.running().length}`, caption: 'on machines now'},
      {label: 'WAITING', value: `${this.pending().length}`, caption: 'queued for a machine'},
      {label: 'LONGEST WAIT', value: longest === null ? '–' : sinceText(new Date(longest).toISOString()).replace(' ago', ''), caption: longest === null ? 'nothing waiting' : 'oldest queued job'},
      {label: 'GPUS HELD', value: `${gpus}`, caption: 'by running jobs'},
    ];
  });

  protected stateClass = stateClass;
  protected sinceText = sinceText;

  protected requirements(job: SchedulerJob): string[] {
    const r = job.requirements;
    if (!r) {
      return ['whole machine'];
    }
    const chips = [`${r.cpus} CPU`, `${r.ram_gb} GB RAM`];
    if (r.gpus.count) {
      const memory = r.gpus.min_memory_gb ? ` ≥ ${r.gpus.min_memory_gb} GB` : '';
      chips.push(`${r.gpus.count} GPU${r.gpus.count > 1 ? 's' : ''}${memory}`);
    }
    if (r.max_runtime_min) {
      chips.push(`≤ ${r.max_runtime_min} min`);
    }
    return chips;
  }

  protected where(job: SchedulerJob): string {
    return job.state === 'running' ? (job.worker ?? '–') : (job.reason ?? 'waiting for a free machine');
  }

  protected eventText(e: SchedulerEvent): string {
    return e.detail || e.kind.replace(/_/g, ' ');
  }

  protected eventClass(kind: string): string {
    switch (kind) {
      case 'failed':
      case 'worker_lost':
        return 'state-bad';
      case 'retried':
      case 'cancelled':
      case 'priority_changed':
        return 'state-warn';
      case 'claimed':
      case 'placed':
      case 'worker_back':
        return 'state-ok';
      default:
        return 'state-idle';
    }
  }
}
