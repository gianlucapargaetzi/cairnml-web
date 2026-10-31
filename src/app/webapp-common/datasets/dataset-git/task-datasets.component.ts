import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {SectionHeaderComponent} from '@common/shared/components/section-header/section-header.component';
import {datasetsOfHyperparams, RawDatasetTask} from './dataset-git.model';

// The datasets a task used, from the Datasets parameters it recorded. Each one links to its entry on the Datasets page.
@Component({
  selector: 'sm-task-datasets',
  templateUrl: './task-datasets.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SectionHeaderComponent]
})
export class TaskDatasetsComponent {
  hyperparams = input<RawDatasetTask['hyperparams']>();

  groups = computed(() => datasetsOfHyperparams(this.hyperparams()));
}
