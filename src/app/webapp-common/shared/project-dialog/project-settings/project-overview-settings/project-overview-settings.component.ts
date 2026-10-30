import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {MatSlideToggle, MatSlideToggleChange} from '@angular/material/slide-toggle';
import {MatRadioButton, MatRadioChange, MatRadioGroup} from '@angular/material/radio';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {OverviewSettingsService} from '@common/project-info/overview-settings.service';
import {
  CONTRIBUTION_PERIOD_OPTIONS,
  CONTRIBUTION_TOP_OPTIONS,
  moveOverviewPanel,
  OVERVIEW_PANEL_LABELS,
  OverviewPanelId,
  OverviewSettings
} from '@common/project-info/overview-panels';

/**
 * The panels of the project overview: show, hide and order them, and the period and size of the contribution panel.
 * Changes are kept at once for the signed-in user, like the other view settings, so there is no Save button.
 */
@Component({
  selector: 'sm-project-overview-settings',
  templateUrl: './project-overview-settings.component.html',
  styleUrls: ['./project-overview-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatSlideToggle, MatRadioGroup, MatRadioButton, MatIconButton, MatIcon, TooltipDirective]
})
export class ProjectOverviewSettingsComponent {
  private overviewSettings = inject(OverviewSettingsService);

  projectId = input.required<string>();

  protected readonly labels = OVERVIEW_PANEL_LABELS;
  protected readonly periodOptions = CONTRIBUTION_PERIOD_OPTIONS;
  protected readonly topOptions = CONTRIBUTION_TOP_OPTIONS;
  protected readonly settings = computed(() => this.overviewSettings.settings(this.projectId()));

  protected setShown(id: OverviewPanelId, event: MatSlideToggleChange) {
    this.update({
      panels: this.settings().panels.map(panel => panel.id === id ? {...panel, shown: event.checked} : panel)
    });
  }

  protected move(id: OverviewPanelId, direction: -1 | 1) {
    this.update({panels: moveOverviewPanel(this.settings().panels, id, direction)});
  }

  protected setPeriod(event: MatRadioChange) {
    this.update({contribution: {...this.settings().contribution, periodDays: event.value}});
  }

  protected setTopContributors(event: MatRadioChange) {
    this.update({contribution: {...this.settings().contribution, topContributors: event.value}});
  }

  protected periodLabel(days: number) {
    return `Last ${days} days`;
  }

  private update(changes: Partial<OverviewSettings>) {
    this.overviewSettings.save(this.projectId(), {...this.settings(), ...changes});
  }
}
