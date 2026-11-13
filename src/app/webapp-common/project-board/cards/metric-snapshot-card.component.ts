import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectSelectedProject} from '@common/core/reducers/projects.reducer';
import {ProjectStatsComponent} from '@common/project-info/conteiners/project-stats/project-stats.component';

/** The old overview's "Metric snapshot" panel as a card: a title and the statistics, which used to sit in an expansion panel. */
@Component({
  selector: 'sm-metric-snapshot-card',
  template: `
    <div class="title">Metric snapshot</div>
    <sm-project-stats [project]="project()"></sm-project-stats>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow: auto; background-color: var(--color-surface-container-low);
            border-radius: var(--radius-lg); }
    .title { padding: var(--space-3) var(--space-4); font-size: var(--font-size-lg); font-weight: var(--font-weight-medium); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProjectStatsComponent],
})
export class MetricSnapshotCardComponent {
  readonly projectId = input.required<string>();
  readonly settings = input<Record<string, unknown>>({});
  protected readonly project = inject(Store).selectSignal(selectSelectedProject);
}
