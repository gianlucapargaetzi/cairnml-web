import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {PrimeTemplate} from 'primeng/api';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {CardComponent} from '@common/shared/ui-components/panel/card/card.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {pollWhileVisible} from './scheduler-live';
import {SchedulerApiService, SchedulerJob, SchedulerEvent} from './scheduler-api.service';
import {StatCard, sinceText, stateClass} from './scheduler-view';

const JOB_COLUMNS: ISmCol[] = [
  {id: 'job', header: 'JOB', style: {minWidth: '220px'}},
  {id: 'state', header: 'STATE', style: {width: '120px'}},
  {id: 'priority', header: 'PRIORITY', style: {width: '100px'}},
  {id: 'needs', header: 'NEEDS', style: {width: '260px'}},
  {id: 'where', header: 'WHERE / WHY', style: {minWidth: '240px'}},
  {id: 'since', header: 'SINCE', style: {width: '130px'}},
];

type Filter = 'all' | 'running' | 'pending';

@Component({
  selector: 'sm-jobs-list',
  templateUrl: './jobs-list.component.html',
  styleUrls: ['./jobs-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TableComponent, PrimeTemplate, MatButtonToggleModule, DecimalPipe, CardComponent, TooltipDirective],
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

  protected readonly stats = computed<StatCard[]>(() => {
    const longest = this.pending().reduce<number | null>((oldest, j) => {
      const t = j.since ? Date.parse(j.since) : null;
      return t === null ? oldest : oldest === null ? t : Math.min(oldest, t);
    }, null);
    const gpus = this.running().reduce((sum, j) => sum + (j.gpus?.length ?? 0), 0);
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
      chips.push(`${r.gpus.count} GPU${r.gpus.count > 1 ? 's' : ''}`);
      if (r.gpus.min_memory_gb) {
        chips.push(`≥ ${r.gpus.min_memory_gb} GB each`);
      }
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
