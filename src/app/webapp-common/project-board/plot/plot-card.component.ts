import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {DecimalPipe} from '@angular/common';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {DonutComponent, DonutChartData} from '@common/shared/components/charts/donut/donut.component';
import {LineChartComponent, Topic} from '@common/shared/components/charts/line-chart/line-chart.component';
import {ScatterPlotComponent} from '@common/shared/components/charts/scatter-plot/scatter-plot.component';
import {ScatterPlotSeries} from '@common/core/reducers/projects.reducer';
import {presetColors} from '@common/shared/ui-components/inputs/color-picker/color-picker-wrapper.component';
import {PlotDataService} from './plot-data.service';
import {PlotModel, plotTitle} from './plot-model';
import {normalizePlotSettings} from './plot-spec';

type Series = Extract<PlotModel, {kind: 'series'}>;
type Scatter = Extract<PlotModel, {kind: 'scatter'}>;

/** A plot of the runs of the project: the card draws what its settings say with the app's chart components. */
@Component({
  selector: 'sm-plot-card',
  templateUrl: './plot-card.component.html',
  styleUrls: ['./plot-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, MatProgressSpinner, LineChartComponent, DonutComponent, ScatterPlotComponent],
})
export class PlotCardComponent {
  private readonly data = inject(PlotDataService);
  readonly projectId = input.required<string>();
  readonly settings = input<Record<string, unknown>>({});

  protected readonly spec = computed(() => normalizePlotSettings(this.settings()));
  protected readonly title = computed(() => plotTitle(this.spec()));
  protected readonly colors = presetColors;

  protected readonly plot = rxResource({
    params: () => ({projectId: this.projectId(), spec: this.spec()}),
    stream: ({params}) => this.data.load(params.projectId, params.spec),
  });

  protected readonly topics = (model: Series): Topic[] => model.series.map((series, index) => ({
    topicID: `${index}`, topicName: series.name, topic: index,
    dates: series.points.map(point => ({value: point.y, date: point.x})),
    ...(model.area ? {fillBackground: `${presetColors[index % presetColors.length]}33`} : {}),
  }));

  protected readonly slices = (slices: {name: string; quantity: number}[]): DonutChartData[] => slices.map(slice => ({...slice}));

  protected readonly scatter = (model: Scatter): ScatterPlotSeries[] => [{
    label: model.yLabel, backgroundColor: presetColors[0],
    data: model.points.map(point => ({id: point.id, x: point.x, y: point.y, name: point.name})),
  }];
}
