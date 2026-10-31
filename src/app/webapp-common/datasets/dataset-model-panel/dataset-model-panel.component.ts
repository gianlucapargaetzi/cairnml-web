import {ChangeDetectionStrategy, Component} from '@angular/core';

export const DATASET_DOCS_URL = 'https://github.com/gianlucapargaetzi/cairnml/blob/main/docs/datasets.md';

@Component({
  selector: 'sm-dataset-model-panel',
  templateUrl: './dataset-model-panel.component.html',
  styleUrls: ['./dataset-model-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatasetModelPanelComponent {
  readonly docsUrl = DATASET_DOCS_URL;
}
