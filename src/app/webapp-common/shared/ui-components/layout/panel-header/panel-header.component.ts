import {ChangeDetectionStrategy, Component, input} from '@angular/core';

/**
 * Header of a panel inside a page (the detail of a task or a model, a pipeline run). It is drawn in place, unlike `sm-page-header`,
 * which hands its content to the header of the application. Content projection:
 *  - [back]: optional back button, before the title
 *  - [title-edit]: content inside the title (an inline-editable name)
 *  - [status]: optional status badge, after the title
 *  - [actions]: buttons on the right
 */
@Component({
  selector: 'sm-panel-header',
  templateUrl: './panel-header.component.html',
  styleUrls: ['./panel-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: []
})
export class PanelHeaderComponent {
  title = input<string>('');
  description = input<string>();
}
