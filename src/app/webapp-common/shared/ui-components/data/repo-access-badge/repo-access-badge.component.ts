import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {RepoAccess} from '@common/shared/services/repo-access.service';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';

// How a repository is reached: "Publicly accessible", "Accessible via GitHub App X", "Accessible via token for host",
// or "Access refused" (with the reason in the tooltip).
@Component({
  selector: 'sm-repo-access-badge',
  templateUrl: './repo-access-badge.component.html',
  styleUrls: ['./repo-access-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TooltipDirective],
})
export class RepoAccessBadgeComponent {
  access = input<RepoAccess | null>(null);

  protected readonly label = computed(() => {
    const access = this.access();
    if (!access) {
      return '';
    }
    switch (access.state) {
      case 'public': return 'Publicly accessible';
      case 'app': return `Accessible via GitHub App ${access.via}`;
      case 'token': return `Accessible via token (${access.via})`;
      default: return 'Access refused';
    }
  });

  protected readonly refused = computed(() => this.access()?.state === 'refused');
}
