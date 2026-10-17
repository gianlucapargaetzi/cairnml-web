import {ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {RouterLink} from '@angular/router';
import {Store} from '@ngrx/store';
import {firstValueFrom} from 'rxjs';
import {map} from 'rxjs/operators';
import {selectRouterParams, selectRouterUrl} from '../../core/reducers/router-reducer';
import {selectSelectedProject} from '../../core/reducers/projects.reducer';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';

/** How far up a parent chain the trail follows to find the task (the root of the chain). */
const MAX_PARENT_DEPTH = 10;

interface Trail {
  experiment: string;
  task: string;
}

interface Segment {
  label: string;
  link?: string[];
}

/**
 * A small trail under the page title, for orientation: Project > Task > Experiment.
 * It shows the levels of the page you are on: the project, the task folder, and the experiment.
 */
@Component({
  selector: 'sm-task-trail',
  templateUrl: './task-trail.component.html',
  styleUrls: ['./task-trail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TooltipDirective],
})
export class TaskTrailComponent {
  private store = inject(Store);
  private tasks = inject(ApiTasksService);

  private params = toSignal(this.store.select(selectRouterParams).pipe(map(p => p ?? {})), {initialValue: {} as Record<string, string>});
  private url = toSignal(this.store.select(selectRouterUrl), {initialValue: ''});
  private project = this.store.selectSignal(selectSelectedProject);
  /** The names of the experiment and its task, once the experiment has been looked up. */
  private resolved = signal<Trail | null>(null);

  protected readonly projectId = computed(() => this.params()['projectId'] as string | undefined);
  /** The experiment id is read from the URL: the router params do not carry it below the experiment's tab. */
  private readonly experimentId = computed(() => this.url()?.match(/^\/projects\/[^/]+\/tasks\/([^/?#]+)/)?.[1]);
  protected readonly segments = computed<Segment[]>(() => {
    const projectId = this.projectId();
    if (!projectId || projectId === '*') {
      return [];
    }
    const projectName = this.project()?.basename ?? this.project()?.name ?? projectId;
    const segments: Segment[] = [{label: projectName, link: ['/projects', projectId, 'folders']}];
    const experimentId = this.experimentId();
    const folder = this.params()['folder'] as string | undefined;
    const resolved = this.resolved();

    if (experimentId && resolved?.task) {
      segments.push({label: resolved.task, link: ['/projects', projectId, 'folders', resolved.task]});
      segments.push({label: resolved.experiment});
    } else if (folder) {
      segments.push({label: folder});
    }
    return segments;
  });

  constructor() {
    effect(() => {
      const projectId = this.projectId();
      const experimentId = this.experimentId();
      this.resolved.set(null);
      if (projectId && experimentId) {
        untracked(() => this.resolve(experimentId).then(trail => {
          if (this.experimentId() === experimentId) {
            this.resolved.set(trail);
          }
        }));
      }
    });
  }

  /** The experiment's name, and the name of the task it belongs to (the root of its parent chain). */
  private async resolve(experimentId: string): Promise<Trail | null> {
    const experiment = await this.fetchNameAndParent(experimentId);
    if (!experiment) {
      return null;
    }
    let root = experiment;
    for (let depth = 0; root.parent && depth < MAX_PARENT_DEPTH; depth++) {
      const parent = await this.fetchNameAndParent(root.parent);
      if (!parent) {
        break;
      }
      root = parent;
    }
    return {experiment: experiment.name || experimentId, task: root.name || ''};
  }

  private async fetchNameAndParent(id: string): Promise<{name: string; parent?: string} | null> {
    const response = await firstValueFrom(this.tasks.tasksGetAllEx({
      id: [id],
      only_fields: ['name', 'parent'],
      page_size: 1,
    }));
    const task = response?.tasks?.[0];
    return task ? {name: task.name, parent: task.parent} : null;
  }
}
