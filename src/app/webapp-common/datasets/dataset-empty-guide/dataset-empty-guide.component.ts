import {ChangeDetectionStrategy, Component} from '@angular/core';
import {EmptyStateComponent} from '@common/shared/ui-components/feedback/empty-state/empty-state.component';
import {CodeEditorComponent} from '@common/shared/ui-components/data/code-editor/code-editor.component';

// What is shown when no dataset exists yet: the empty state, a short explanation, one code sample that creates a local
// dataset, and a note on dataset registries. The full "How datasets work" panel appears once datasets are listed.
@Component({
  selector: 'sm-dataset-empty-guide',
  templateUrl: './dataset-empty-guide.component.html',
  styleUrls: ['./dataset-empty-guide.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent, CodeEditorComponent],
})
export class DatasetEmptyGuideComponent {
  protected readonly localCode = `pip install "cairnml[dataset]"
# the files of a folder become a dataset: a Git repository, each commit one version
cairnml dataset create cars-data --from /path/to/measurements --storage s3
cairnml dataset register`;

  // one line of a code cell is about 21px high; the cell adds a little padding
  protected height(code: string): number {
    return code.split('\n').length * 21 + 20;
  }
}
