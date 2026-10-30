import {ChangeDetectionStrategy, Component, input} from '@angular/core';

/**
 * Shared page header (docs/design-system/03-layout-system.md, 3.2).
 * Content projection:
 *  - [back]: optional back button, before the title
 *  - [status]: optional status badge, after the title
 *  - [actions]: buttons on the right, secondary first, at most one primary
 */
@Component({
  selector: 'sm-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: []
})
export class PageHeaderComponent {
  title = input.required<string>();
  description = input<string>();
}
