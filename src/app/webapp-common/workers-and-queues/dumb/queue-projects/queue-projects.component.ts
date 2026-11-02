import {ChangeDetectionStrategy, Component, effect, inject, input, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {forkJoin, lastValueFrom, Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatProgressSpinner} from '@angular/material/progress-spinner';

export interface QueueProjectAllocation {
  id: string;
  name: string;
}

/**
 * The root projects a queue is allocated to. The API lists the queues of a project, not the projects of a queue,
 * so the list is built from the projects the user can read. Projects the user cannot read are left out.
 */
@Component({
  selector: 'sm-queue-projects',
  templateUrl: './queue-projects.component.html',
  styleUrls: ['./queue-projects.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ShowTooltipIfEllipsisDirective, TooltipDirective, MatProgressSpinner]
})
export class QueueProjectsComponent {
  private projectsApi = inject(ApiProjectsService);

  queueId = input.required<string>();

  protected projects = signal<QueueProjectAllocation[]>(null);
  protected error = signal<string>(null);

  constructor() {
    // reloads when the selected queue changes while the tab stays open
    effect(() => this.load(this.queueId()));
  }

  protected async load(queueId: string) {
    this.error.set(null);
    this.projects.set(null);
    try {
      const all = await lastValueFrom(this.projectsApi.projectsGetAllEx({only_fields: ['id', 'name']}));
      const requests: Observable<QueueProjectAllocation | null>[] = (all.projects ?? []).map(project =>
        this.projectsApi.projectsGetQueues({project: project.id}).pipe(
          map((res): QueueProjectAllocation | null => (res.queues ?? []).some(queue => queue.id === queueId) ? {id: project.id, name: project.name} : null),
          catchError(() => of(null))
        )
      );
      // forkJoin does not emit for an empty list, so an account without projects is handled apart
      const perProject = requests.length ? await lastValueFrom(forkJoin(requests)) : [];
      this.projects.set(perProject.filter(project => !!project));
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The projects of the queue could not be loaded.');
    }
  }
}
