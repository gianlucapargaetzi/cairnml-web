import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {RecentExperimentsComponent} from '@common/project-info/recent-experiments/recent-experiments.component';

/** The old overview's "Recent tasks" panel as a card. */
@Component({
  selector: 'sm-recent-tasks-card',
  template: '<sm-recent-experiments [projectId]="projectId()"></sm-recent-experiments>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RecentExperimentsComponent],
})
export class RecentTasksCardComponent {
  readonly projectId = input.required<string>();
  readonly settings = input<Record<string, unknown>>({});
}
