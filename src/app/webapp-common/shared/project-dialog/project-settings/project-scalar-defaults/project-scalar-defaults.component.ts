import {ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, signal, Signal} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {Store} from '@ngrx/store';
import {switchMap} from 'rxjs/operators';
import {
  groupByCharts,
  GroupByCharts,
  setExperimentSettings
} from '@common/experiments/actions/common-experiment-output.actions';
import {smoothTypeEnum, SmoothTypeEnum} from '@common/shared/single-graph/single-graph.utils';
import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';
import {
  selectSelectedExperimentSettings,
  selectSelectedSettingsHiddenScalar
} from '@common/experiments/reducers';
import {sortByFieldSummaryFirst} from '@common/tasks/tasks.utils';
import {singleValueChartTitle} from '@common/experiments/shared/common-experiments.const';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {GroupedList} from '@common/tasks/tasks.model';
import {PlotData} from 'plotly.js';
import {
  GraphSettingsBarComponent
} from '@common/shared/experiment-graphs/graph-settings-bar/graph-settings-bar.component';
import {
  SelectableGroupedFilterListComponent
} from '@common/shared/ui-components/data/selectable-grouped-filter-list/selectable-grouped-filter-list.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ProjectSettingsStore} from '~/features/dashboard-search/project-settings-dashboard-search-permissions.store';
import {MatIconModule} from '@angular/material/icon';

/** The default scalar view of a project: smoothing, x-axis, grouping and which metrics are shown by default. */
@Component({
  selector: 'sm-project-scalar-defaults',
  templateUrl: './project-scalar-defaults.component.html',
  styleUrls: ['./project-scalar-defaults.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,GraphSettingsBarComponent, SelectableGroupedFilterListComponent, TooltipDirective]
})
export class ProjectScalarDefaultsComponent {
  private store = inject(Store);
  private settingsStore = inject(ProjectSettingsStore);

  projectId = input.required<string>();

  protected groupByOptions = [
    {
      name: 'Metric',
      value: groupByCharts.metric
    },
    {
      name: 'None',
      value: groupByCharts.none
    }
  ];

  private defaultSettings = {
    groupBy: groupByCharts.metric,
    smoothWeight: 0,
    smoothSigma: 2,
    smoothType: smoothTypeEnum.exponential,
    xAxisType: ScalarKeyEnum.Iter,
    hiddenMetricsScalar: [],
    showOriginals: true,
    projectLevel: false
  };

  protected searchTerm = signal('');
  private storeListOfHidden = toSignal(
    toObservable(this.projectId).pipe(switchMap(id => this.store.select(selectSelectedSettingsHiddenScalar(id))))
  );
  protected listOfHidden = linkedSignal(() => [...(this.storeListOfHidden() ?? [])]);

  private storeSettings = toSignal(
    toObservable(this.projectId).pipe(switchMap(id => this.store.select(selectSelectedExperimentSettings(id))))
  );
  protected settings = linkedSignal(() => ({...this.defaultSettings, ...this.storeSettings()}));
  protected settingsGroupBy = computed(() => this.settings().groupBy);

  protected scalarsWithoutSummary = computed(() => this.settingsStore.scalars().map(variant => variant.metric === singleValueChartTitle ? {...variant, variant: null} : variant));
  protected originalScalarList = computed(() => [
    ...this.scalarsWithoutSummary().map(({metric, variant}) => ({
      metric,
      variant
    }))
  ]);

  protected scalarList: Signal<GroupedList> = computed(() => ({
    ...this.groupByMetric(this.scalarsWithoutSummary(), this.settingsGroupBy() === 'none')
  }));

  protected selectedMetrics = computed(() => {
    const selectedMetrics = this.settingsGroupBy() === 'metric' ? this.originalScalarList().filter(({metric}) => !this.listOfHidden().includes(metric)) :
      this.originalScalarList().filter(({metric, variant}) => variant !== null ?
      !this.listOfHidden().includes(`${metric}${variant}`) && !this.listOfHidden().includes(metric) :
      !this.listOfHidden().includes(metric)
    );

    const metricsWithoutVariants = selectedMetrics
      .map(({metric}) => metric)
      .filter(m => !!m);
    return Array.from(new Set([
      ...selectedMetrics.map(({metric, variant}) => `${metric}${variant}`),
      ...metricsWithoutVariants
    ]));
  });

  protected scalarSettingsChanged = signal(false);
  protected hiddenChanged = signal(false);
  /** True while there are changes that save() would store. */
  hasChanges = computed(() => this.scalarSettingsChanged() || this.hiddenChanged());

  changeSmoothness($event: number) {
    this.scalarSettingsChanged.set(true);
    this.settings.update(settings => ({...settings, smoothWeight: $event}));
  }

  changeSigma($event: number) {
    this.scalarSettingsChanged.set(true);
    this.settings.update(settings => ({...settings, smoothSigma: $event}));
  }

  changeSmoothType($event: SmoothTypeEnum) {
    this.scalarSettingsChanged.set(true);
    this.settings.update(settings => ({
      ...settings, smoothType: $event,
      ...(settings.smoothType !== smoothTypeEnum.gaussian && {smoothSigma: 2})
    }));
  }

  changeXAxisType($event: ScalarKeyEnum) {
    this.scalarSettingsChanged.set(true);
    this.settings.update(settings => ({...settings, xAxisType: $event}));
  }

  changeGroupBy($event: GroupByCharts) {
    this.scalarSettingsChanged.set(true);
    this.settings.update(settings => ({...settings, groupBy: $event}));
  }

  changeShowOriginals($event: boolean) {
    this.scalarSettingsChanged.set(true);
    this.settings.update(settings => ({...settings, showOriginals: $event}));
  }

  groupByMetric(variants: MetricVariantResult[], groupBy: boolean): GroupedList {
    const result: GroupedList = {};

    sortByFieldSummaryFirst(variants, 'metric').forEach((variant) => {
      if (!result[variant.metric]) {
        result[variant.metric] = {};
      }

      if (groupBy && variant.variant) {
        result[variant.metric][variant.variant] = {} as PlotData;
      }
    });

    return result;
  }

  hiddenListChanged(hiddenList: string[]) {
    if (Object.keys(this.scalarList() ?? {}).length > 0) {
      this.hiddenChanged.set(true);
    }
    const metrics = Object.keys(this.scalarList());
    const variants = metrics.map((metric) => Object.keys(this.scalarList()[metric]).map(v => metric + v)).flat(2);
    this.listOfHidden.set([...metrics, ...variants].filter(metric => !hiddenList.includes(metric)));
  }

  searchTermChanged(searchTerm: string) {
    this.searchTerm.set(searchTerm);
  }

  /** Stores the changes made on this tab, if there are any. */
  save() {
    if (!this.hasChanges()) {
      return;
    }
    this.store.dispatch(setExperimentSettings({
      id: this.projectId(),
      changes: {
        ...{
          ...this.settings(),
          hiddenMetricsScalar: this.settings().hiddenMetricsScalar?.length > 0 ? this.settings().hiddenMetricsScalar : undefined,
          projectLevel: true},
        ...(this.hiddenChanged() && {hiddenMetricsScalar: this.listOfHidden()})
      }
    }));
    this.scalarSettingsChanged.set(false);
    this.hiddenChanged.set(false);
  }
}
