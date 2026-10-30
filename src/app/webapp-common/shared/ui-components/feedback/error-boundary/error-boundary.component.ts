import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {ErrorBoundaryService} from './error-boundary.service';

/**
 * Full-page message shown after an unexpected exception. Offers a reload and a
 * reference id for the administrator. Renders nothing until an error is reported.
 */
@Component({
  selector: 'sm-error-boundary',
  templateUrl: './error-boundary.component.html',
  styleUrls: ['./error-boundary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule]
})
export class ErrorBoundaryComponent {
  protected boundary = inject(ErrorBoundaryService);

  protected reload(): void {
    window.location.reload();
  }
}
