import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {forkJoin, map, of, switchMap} from 'rxjs';
import {HTTP} from '~/app.constants';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {AgentsView, agentRows, QueueInfo, WorkerInfo} from './agents';

/** The agents that serve the project's queues, what they run and how many tasks wait. */
@Component({
  selector: 'sm-agents-card',
  templateUrl: './agents-card.component.html',
  styleUrls: ['./agents-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinner],
})
export class AgentsCardComponent {
  private readonly api = inject(SmApiRequestsService);
  readonly projectId = input.required<string>();
  readonly settings = input<Record<string, unknown>>({});

  private post<T>(action: string, body: object) {
    return this.api.post<T>(`${HTTP.API_BASE_URL}/${action}`, body, {});
  }

  protected readonly view = rxResource<AgentsView, string>({
    params: () => this.projectId(),
    stream: ({params}) => this.post<{queues?: {id: string; name: string}[]}>('projects.get_queues', {project: params}).pipe(
      switchMap(({queues = []}) => !queues.length ? of(agentRows([], [])) : forkJoin({
        waiting: this.post<{queues?: {id: string; entries?: unknown[]}[]}>('queues.get_all_ex', {id: queues.map(queue => queue.id), only_fields: ['id', 'entries']}),
        workers: this.post<{workers?: WorkerInfo[]}>('workers.get_all', {last_seen: 3600}),
      }).pipe(map(({waiting, workers}) => {
        const counts = new Map((waiting.queues ?? []).map(queue => [queue.id, queue.entries?.length ?? 0]));
        const infos: QueueInfo[] = queues.map(queue => ({id: queue.id, name: queue.name, waiting: counts.get(queue.id) ?? 0}));
        return agentRows(infos, workers.workers ?? []);
      }))),
    ),
  });
}
