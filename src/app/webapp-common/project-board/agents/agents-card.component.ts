import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {forkJoin, map, of, switchMap} from 'rxjs';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {ApiQueuesService} from '~/business-logic/api-services/queues.service';
import {ApiWorkersService} from '~/business-logic/api-services/workers.service';
import {CardHeadingComponent} from '../shared/card-heading.component';
import {AgentsView, agentRows, QueueInfo, WorkerInfo} from './agents';

/** The agents that serve the project's queues, what they run and how many tasks wait. */
@Component({
  selector: 'sm-agents-card',
  templateUrl: './agents-card.component.html',
  styleUrls: ['./agents-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardHeadingComponent, MatProgressSpinner],
})
export class AgentsCardComponent {
  private readonly projects = inject(ApiProjectsService);
  private readonly queues = inject(ApiQueuesService);
  private readonly workers = inject(ApiWorkersService);
  readonly projectId = input.required<string>();
  readonly settings = input<Record<string, unknown>>({});

  protected readonly view = rxResource<AgentsView, string>({
    params: () => this.projectId(),
    stream: ({params}) => this.projects.projectsGetQueues({project: params}).pipe(
      switchMap(({queues = []}) => !queues.length ? of(agentRows([], [])) : forkJoin({
        waiting: this.queues.queuesGetAllEx({id: queues.map(queue => queue.id), only_fields: ['id', 'entries']}),
        workers: this.workers.workersGetAll({last_seen: 3600}),
      }).pipe(map(({waiting, workers}) => {
        const counts = new Map((waiting.queues ?? []).map(queue => [queue.id, queue.entries?.length ?? 0]));
        const infos: QueueInfo[] = queues.map(queue => ({id: queue.id, name: queue.name, waiting: counts.get(queue.id) ?? 0}));
        return agentRows(infos, workers.workers ?? []);
      }))),
    ),
  });
}
