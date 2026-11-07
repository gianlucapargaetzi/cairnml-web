import {ChangeDetectionStrategy, Component} from '@angular/core';
import {EmptyStateComponent} from '@common/shared/ui-components/feedback/empty-state/empty-state.component';

// What is shown when no dataset exists yet: the same empty state as the Repositories tab. How to create a dataset is in
// the help dialog (the ? button of the page header).
@Component({
  selector: 'sm-dataset-empty-guide',
  templateUrl: './dataset-empty-guide.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent],
})
export class DatasetEmptyGuideComponent {}
