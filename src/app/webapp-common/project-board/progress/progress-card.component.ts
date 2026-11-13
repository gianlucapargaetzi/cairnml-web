import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {DecimalPipe} from '@angular/common';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {map, of} from 'rxjs';
import {PlotDataService} from '../plot/plot-data.service';
import {DEFAULT_PLOT, PlotSpec, runsScope} from '../plot/plot-spec';
import {CardHeadingComponent} from '../shared/card-heading.component';
import {CardTileComponent, CardTilesComponent} from '../shared/card-tiles.component';
import {computeProgress, Progress, progressSettings, ProgressSettings} from './progress';

/** The progress of a project on one metric: the best value, how many runs failed and how long it has been since the best value improved. */
@Component({
  selector: 'sm-progress-card',
  templateUrl: './progress-card.component.html',
  styleUrls: ['./progress-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardHeadingComponent, CardTileComponent, CardTilesComponent, DecimalPipe, MatProgressSpinner],
})
export class ProgressCardComponent {
  private readonly data = inject(PlotDataService);
  readonly projectId = input.required<string>();
  readonly settings = input<Record<string, unknown>>({});

  protected readonly options = computed(() => progressSettings(this.settings()));

  protected readonly title = computed(() => {
    const metric = this.options().metric;
    return metric ? `Progress on ${metric.metric} / ${metric.variant}` : 'Progress on a metric';
  });
  protected readonly scope = computed(() => runsScope(this.options().task ? {scope: 'task', task: this.options().task!} : {scope: 'project'}));

  protected readonly result = rxResource<{progress: Progress; capped: boolean} | null, {projectId: string; options: ProgressSettings}>({
    params: () => ({projectId: this.projectId(), options: this.options()}),
    stream: ({params: {projectId, options}}) => {
      if (!options.metric) {
        return of(null);
      }
      const spec: PlotSpec = {
        ...DEFAULT_PLOT, source: {kind: 'scalar', ...options.metric}, view: 'evolution', goal: options.goal,
        runValue: options.goal === 'min' ? 'min' : 'max',
        runs: options.task ? {scope: 'task', task: options.task} : {scope: 'project'},
      };
      return this.data.runs(projectId, spec).pipe(map(({runs, capped}) => ({
        progress: computeProgress(runs.map(({created, status, value}) => ({created, status, value})), options.goal), capped,
      })));
    },
  });

  protected readonly percent = (rate: number) => `${Math.round(rate * 100)}%`;
}
