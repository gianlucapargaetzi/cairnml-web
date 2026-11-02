import {ChangeDetectionStrategy, Component, effect, inject, input, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {lastValueFrom} from 'rxjs';
import {ApiQueuesService} from '~/business-logic/api-services/queues.service';
import {QueuesGetProjectsResponseProjects} from '~/business-logic/model/queues/queuesGetProjectsResponseProjects';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatProgressSpinner} from '@angular/material/progress-spinner';

/** The root projects a queue is allocated to, as far as the user can see them. */
@Component({
  selector: 'sm-queue-projects',
  templateUrl: './queue-projects.component.html',
  styleUrls: ['./queue-projects.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ShowTooltipIfEllipsisDirective, TooltipDirective, MatProgressSpinner]
})
export class QueueProjectsComponent {
  private queuesApi = inject(ApiQueuesService);

  queueId = input.required<string>();

  protected projects = signal<QueuesGetProjectsResponseProjects[]>(null);
  protected error = signal<string>(null);

  constructor() {
    // reloads when the selected queue changes while the tab stays open
    effect(() => this.load(this.queueId()));
  }

  protected async load(queueId: string) {
    this.error.set(null);
    this.projects.set(null);
    try {
      const res = await lastValueFrom(this.queuesApi.queuesGetProjects({queue: queueId}));
      this.projects.set(res.projects ?? []);
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The projects of the queue could not be loaded.');
    }
  }
}
