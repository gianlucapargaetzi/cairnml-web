import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {ProjectContributionComponent} from '@common/project-info/contribution/project-contribution.component';
import {CONTRIBUTION_TOP_OPTIONS, contributionSettings} from './contribution-settings';

/** The old overview's "Contributions" panel as a card. Its only setting is how many contributors the ranking lists. */
@Component({
  selector: 'sm-contributions-card',
  template: '<sm-project-contribution [projectId]="projectId()" [topContributors]="top()"></sm-project-contribution>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProjectContributionComponent],
})
export class ContributionsCardComponent {
  readonly projectId = input.required<string>();
  readonly settings = input<Record<string, unknown>>({});
  protected readonly top = computed(() => contributionSettings(this.settings()).topContributors);
  protected readonly options = CONTRIBUTION_TOP_OPTIONS;
}
