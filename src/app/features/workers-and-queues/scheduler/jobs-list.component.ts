import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {PrimeTemplate} from 'primeng/api';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {pollWhileVisible} from './scheduler-live';
import {SchedulerApiService, SchedulerJob} from './scheduler-api.service';

const JOB_COLUMNS: ISmCol[] = [
  {id: 'state', header: 'STATE', style: {width: '110px'}},
  {id: 'name', header: 'JOB', style: {width: '240px', minWidth: '180px'}},
  {id: 'priority', header: 'PRIORITY', style: {width: '100px'}},
  {id: 'requirements', header: 'NEEDS', style: {width: '260px'}},
  {id: 'worker', header: 'WORKER', style: {width: '180px'}},
  {id: 'since', header: 'SINCE', style: {width: '140px'}},
  {id: 'why', header: 'WHY WAITING', style: {minWidth: '260px'}},
];

type Filter = 'all' | 'running' | 'pending';

@Component({
  selector: 'sm-jobs-list',
  templateUrl: './jobs-list.component.html',
  styleUrls: ['./jobs-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TableComponent, PrimeTemplate, MatButtonModule],
})
export class JobsListComponent {
  private api = inject(SchedulerApiService);

  protected readonly columns = JOB_COLUMNS;
  protected readonly filters: Filter[] = ['all', 'running', 'pending'];
  protected readonly filter = signal<Filter>('all');
  protected readonly jobs = pollWhileVisible(() => this.api.jobs());
  // rows need a unique id (the table marks a row selected by its id)
  protected readonly shown = computed(() => {
    const list = (this.jobs() ?? []).map(j => ({...j, id: j.task}));
    const wanted = this.filter();
    return wanted === 'all' ? list : list.filter(j => j.state === wanted);
  });

  protected setFilter(value: Filter) {
    this.filter.set(value);
  }

  protected requirements(job: SchedulerJob): string {
    const r = job.requirements;
    if (!r) {
      return 'whole machine';
    }
    const gpus = r.gpus.count ? `, ${r.gpus.count} GPU${r.gpus.count > 1 ? 's' : ''}${r.gpus.min_memory_gb ? ` ≥ ${r.gpus.min_memory_gb} GB` : ''}` : '';
    return `${r.cpus} CPU, ${r.ram_gb} GB RAM${gpus}`;
  }

  protected since(job: SchedulerJob): string {
    return job.since ? new Date(job.since).toLocaleString() : '–';
  }
}
