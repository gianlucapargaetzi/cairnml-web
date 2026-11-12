import {ChangeDetectionStrategy, Component, computed, inject, input, WritableSignal} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';
import {map} from 'rxjs';
import {PlotDataService} from '../plot/plot-data.service';
import {DEFAULT_PLOT} from '../plot/plot-spec';
import {progressSettings} from './progress';

/** The settings form of a progress card: which runs (all, or one task), which metric and which direction is better. */
@Component({
  selector: 'sm-progress-settings',
  templateUrl: './progress-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormField, MatLabel, MatSelect, MatOption],
})
export class ProgressSettingsComponent {
  private readonly data = inject(PlotDataService);
  readonly draft = input.required<WritableSignal<Record<string, unknown>>>();
  readonly projectId = input.required<string>();

  protected readonly current = computed(() => progressSettings(this.draft()()));
  protected readonly metricKey = computed(() => this.current().metric ? `${this.current().metric!.metric}\u0000${this.current().metric!.variant}` : '');

  protected readonly metrics = rxResource({params: () => this.projectId(), stream: ({params}) => this.data.metrics(params)});
  protected readonly tasks = rxResource({
    params: () => this.projectId(),
    stream: ({params}) => this.data.runs(params, DEFAULT_PLOT).pipe(map(({runs}) => [...new Set(runs.map(run => run.name).filter(Boolean))].sort())),
  });

  protected set(change: Record<string, unknown>): void {
    this.draft().update(settings => ({...settings, ...change}));
  }

  protected chooseMetric(key: string): void {
    const [metric, variant] = key.split('\u0000');
    this.set({metric: metric ? {metric, variant} : null});
  }

  protected readonly key = (item: {metric: string; variant: string}) => `${item.metric}\u0000${item.variant}`;
}
