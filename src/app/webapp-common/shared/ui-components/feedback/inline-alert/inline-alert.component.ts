import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';

export type InlineAlertSeverity = 'error' | 'warning' | 'info';

const SEVERITY_ICON: Record<InlineAlertSeverity, string> = {
  error: 'al-ico-error',
  warning: 'al-ico-alert',
  info: 'al-ico-info-circle',
};

/**
 * Persistent message inside a page or form area (docs/design-system/components/feedback.md).
 * Content projection: default slot for the message, [action] for an optional button or link.
 */
@Component({
  selector: 'sm-inline-alert',
  templateUrl: './inline-alert.component.html',
  styleUrls: ['./inline-alert.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule]
})
export class InlineAlertComponent {
  severity = input<InlineAlertSeverity>('info');

  protected icon = computed(() => SEVERITY_ICON[this.severity()]);
}
