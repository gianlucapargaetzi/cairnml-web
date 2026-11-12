import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectSelectedProject} from '@common/core/reducers/projects.reducer';
import {ProjectStateComponent} from '@common/project-info/project-state/project-state.component';

/** The old overview's "Project state" panel as a card. Every card body declares `projectId` and `settings` (see card-registry.ts). */
@Component({
  selector: 'sm-project-state-card',
  template: '<sm-project-state [project]="project()"></sm-project-state>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProjectStateComponent],
})
export class ProjectStateCardComponent {
  readonly projectId = input.required<string>();
  readonly settings = input<Record<string, unknown>>({});
  protected readonly project = inject(Store).selectSignal(selectSelectedProject);
}
