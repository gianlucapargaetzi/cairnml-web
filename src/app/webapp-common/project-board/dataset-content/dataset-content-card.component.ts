import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {of} from 'rxjs';
import {LineChartComponent, Topic} from '@common/shared/components/charts/line-chart/line-chart.component';
import {presetColors} from '@common/shared/ui-components/inputs/color-picker/color-picker-wrapper.component';
import {RepositoriesService} from '../../datasets/dataset-git/repositories.service';
import {datasetSetting, versionsView} from './dataset-versions';

/** How the number of samples of one dataset changed from version to version, as bars on the time of the version. */
@Component({
  selector: 'sm-dataset-content-card',
  templateUrl: './dataset-content-card.component.html',
  styleUrls: ['./dataset-content-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinner, LineChartComponent],
})
export class DatasetContentCardComponent {
  private readonly repositories = inject(RepositoriesService);
  readonly projectId = input.required<string>();
  readonly settings = input<Record<string, unknown>>({});

  protected readonly dataset = computed(() => datasetSetting(this.settings()));
  protected readonly colors = presetColors;

  protected readonly versions = rxResource({
    params: () => this.dataset(),
    stream: ({params}) => params ? this.repositories.datasetVersions(params) : of(null),
  });

  protected readonly view = computed(() => {
    const versions = this.versions.value();
    return versions ? versionsView(versions) : null;
  });

  protected readonly topics = computed<Topic[]>(() => [{
    topicID: '0', topicName: 'Samples', topic: 0,
    dates: (this.view()?.points ?? []).map(point => ({value: point.y, date: point.x})),
  }]);
}
