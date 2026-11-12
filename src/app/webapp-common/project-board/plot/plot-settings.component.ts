import {ChangeDetectionStrategy, Component, computed, inject, input, WritableSignal} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOptgroup, MatOption, MatSelect} from '@angular/material/select';
import {map} from 'rxjs';
import {PlotDataService} from './plot-data.service';
import {allowedCharts, allowedViews, DEFAULT_PLOT, normalizePlotSettings, PlotChart, PlotSource, PlotSpec, PlotView} from './plot-spec';

const VIEW_LABELS: Record<PlotView, string> = {
  'evolution': 'How it changed over the runs', 'best-run-curve': 'The curve of the best run', 'last-run-curve': 'The curve of the last run',
  'overlay': 'The curves of the newest runs', 'distribution': 'How the runs are distributed', 'vs-parameter': 'Against a parameter',
};
const CHART_LABELS: Record<PlotChart, string> = {line: 'Line', bar: 'Bar', area: 'Area', scatter: 'Scatter', donut: 'Donut', number: 'A single number'};
const FACT_LABELS = {'runs-per-day': 'Runs per day', 'duration': 'Duration of a run', 'status': 'Status of the runs'} as const;
const SEP = '\u0000';

/** The settings form of a plot card: the source, the runs, what to show and how. Each choice limits the ones after it. */
@Component({
  selector: 'sm-plot-settings',
  templateUrl: './plot-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormField, MatLabel, MatSelect, MatOption, MatOptgroup],
})
export class PlotSettingsComponent {
  private readonly data = inject(PlotDataService);
  readonly draft = input.required<WritableSignal<Record<string, unknown>>>();
  readonly projectId = input.required<string>();

  protected readonly spec = computed(() => normalizePlotSettings(this.draft()()));
  protected readonly views = computed(() => allowedViews(this.spec().source).map(value => ({value, label: VIEW_LABELS[value]})));
  protected readonly charts = computed(() => allowedCharts(this.spec()).map(value => ({value, label: CHART_LABELS[value]})));
  protected readonly facts = Object.entries(FACT_LABELS).map(([value, label]) => ({value, label}));

  protected readonly metrics = rxResource({params: () => this.projectId(), stream: ({params}) => this.data.metrics(params)});
  protected readonly parameters = rxResource({params: () => this.projectId(), stream: ({params}) => this.data.parameters(params)});
  protected readonly runs = rxResource({
    params: () => this.projectId(),
    stream: ({params}) => this.data.runs(params, DEFAULT_PLOT).pipe(map(({runs}) => runs)),
  });
  protected readonly taskNames = computed(() => [...new Set((this.runs.value() ?? []).map(run => run.name).filter(Boolean))].sort());
  protected readonly recentRuns = computed(() => (this.runs.value() ?? []).slice(0, 30));

  protected readonly sourceKey = computed(() => {
    const source = this.spec().source;
    return source.kind === 'scalar' ? `scalar${SEP}${source.metric}${SEP}${source.variant}`
      : source.kind === 'metadata' ? `metadata${SEP}${source.section}${SEP}${source.name}` : `fact${SEP}${source.fact}`;
  });
  protected readonly scopeKey = computed(() => {
    const runs = this.spec().runs;
    return runs.scope === 'task' ? `task${SEP}${runs.task}` : runs.scope;
  });
  protected readonly selectedRuns = computed(() => {
    const runs = this.spec().runs;
    return runs.scope === 'set' ? runs.ids : [];
  });
  protected readonly parameterKey = computed(() => {
    const parameter = this.spec().parameter;
    return parameter ? `${parameter.section}${SEP}${parameter.name}` : '';
  });
  protected readonly showsStatistic = computed(() => this.spec().view === 'evolution' && !(this.spec().source.kind === 'fact'));
  protected readonly showsRunValue = computed(() => this.spec().source.kind === 'scalar' && ['evolution', 'distribution', 'vs-parameter'].includes(this.spec().view));
  protected readonly showsGoal = computed(() => this.spec().statistic === 'best-so-far' && this.spec().view === 'evolution' || this.spec().view === 'best-run-curve');

  /** Applies a change and brings the rest of the settings in line with it (a source with fewer views, a chart that suits the view). */
  protected set(change: Partial<PlotSpec>): void {
    this.draft().set({...normalizePlotSettings({...this.spec(), ...change})} as unknown as Record<string, unknown>);
  }

  protected chooseSource(key: string): void {
    const [kind, first, second] = key.split(SEP);
    const source: PlotSource = kind === 'scalar' ? {kind, metric: first, variant: second}
      : kind === 'metadata' ? {kind, section: first, name: second} : {kind: 'fact', fact: first as 'duration' | 'status' | 'runs-per-day'};
    this.set({source});
  }

  protected chooseScope(key: string): void {
    const [scope, task] = key.split(SEP);
    this.set({runs: scope === 'task' ? {scope, task} : scope === 'set' ? {scope, ids: []} : {scope: 'project'}});
  }

  protected chooseParameter(key: string): void {
    const [section, name] = key.split(SEP);
    this.set({parameter: section ? {section, name} : undefined});
  }

  protected readonly metricKey = (item: {metric: string; variant: string}) => `scalar${SEP}${item.metric}${SEP}${item.variant}`;
  protected readonly parameterOptionKey = (item: {section: string; name: string}) => `${item.section}${SEP}${item.name}`;
  protected readonly metadataKey = (item: {section: string; name: string}) => `metadata${SEP}${item.section}${SEP}${item.name}`;
}
