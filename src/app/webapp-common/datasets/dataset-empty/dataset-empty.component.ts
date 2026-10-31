import {ChangeDetectionStrategy, Component, computed, input, signal} from '@angular/core';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {CodeEditorComponent} from '@common/shared/ui-components/data/code-editor/code-editor.component';
import {MatTab, MatTabGroup} from '@angular/material/tabs';
import {NgTemplateOutlet} from '@angular/common';

@Component({
  selector: 'sm-dataset-empty',
  templateUrl: './dataset-empty.component.html',
  styleUrls: ['./dataset-empty.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogTemplateComponent,
    CodeEditorComponent,
    MatTab,
    MatTabGroup,
    NgTemplateOutlet
  ]
})
export class DatasetEmptyComponent {
  initDatasetCLICode = `pip install "cairnml[dataset]"

# needs git, the GitHub command line (gh, logged in) and the CairnML server
cairnml dataset create cars-data --from /path/to/measurements --storage lfs
cairnml dataset doctor
cairnml dataset register`;

  initDatasetSDKCode = `from cairnml import Task
from cairnml.datasets import Dataset

# a commit, tag or branch of a dataset repository; the run records the commit it used
task = Task.init(project_name="cars", task_name="train")
data = Dataset.get("https://github.com/acme/cars-data.git", "3f2a9c1")
print(data.path)   # a folder with the files`;
  showButton = input();
  index = signal(0);
  emptyStateTab = computed(() => this.index() === 0 ? 'cli' : 'sdk');
  showCode = signal(false);

  constructor() {
    window.setTimeout(()=> this.showCode.set(true), 300);
  }
}
