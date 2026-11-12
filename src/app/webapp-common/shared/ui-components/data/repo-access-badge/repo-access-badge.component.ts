import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {RepoAccess} from '@common/shared/services/repo-access.service';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatIconModule} from '@angular/material/icon';

// How a project reads a repository: the credential assigned to it, "None needed", the default (no credential is assigned:
// the host allows a read without one, or the company's access reads it, which is marked with a warning), or "Access
// refused" (with the reason in the tooltip).
@Component({
  selector: 'sm-repo-access-badge',
  templateUrl: './repo-access-badge.component.html',
  styleUrls: ['./repo-access-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TooltipDirective, MatIconModule],
})
export class RepoAccessBadgeComponent {
  access = input<RepoAccess | null>(null);
  // only the icon (the words stay as its tooltip and its accessible name): for a table cell
  iconOnly = input(false);

  protected readonly label = computed(() => {
    const access = this.access();
    if (!access) {
      return '';
    }
    switch (access.state) {
      case 'assigned': return access.via ? `Read with ${access.via}` : 'Read with a credential';
      case 'none_needed': return 'None needed';
      case 'company': return 'Auto-Authenticated via Company Github App';
      case 'unreachable': return 'Access refused';
      default: return 'No credential assigned';
    }
  });

  protected readonly refused = computed(() => this.access()?.state === 'unreachable');
  // readable: the green open lock (public repositories too); not readable: the red closed lock
  protected readonly ok = computed(() => ['assigned', 'none_needed', 'anonymous'].includes(this.access()?.state ?? ''));
  // the company's access reads it without anyone having chosen it: assigning a credential is recommended
  protected readonly warned = computed(() => this.access()?.state === 'company');

  // icon and label together: the colour is never the only signal
  protected readonly icon = computed(() => {
    switch (this.access()?.state) {
      case 'none_needed':
      case 'anonymous':
      case 'assigned':
      case 'unknown': return 'al-ico-lock-open';
      case 'company': return 'al-ico-alert';
      default: return 'al-ico-lock';
    }
  });
}
