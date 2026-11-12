import {ChangeDetectionStrategy, Component, computed, input, WritableSignal} from '@angular/core';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';
import {CONTRIBUTION_TOP_OPTIONS, contributionSettings} from './contribution-settings';

/** The settings form of a contributions card: how many contributors are listed. */
@Component({
  selector: 'sm-contribution-settings',
  template: `
    <mat-form-field appearance="outline" class="w-100">
      <mat-label>Contributors listed</mat-label>
      <mat-select [value]="top()" (selectionChange)="draft().set({topContributors: $event.value})" data-id="contributionTop">
        @for (option of options; track option) {
          <mat-option [value]="option">Top {{ option }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormField, MatLabel, MatSelect, MatOption],
})
export class ContributionSettingsComponent {
  readonly draft = input.required<WritableSignal<Record<string, unknown>>>();
  readonly projectId = input<string>();
  protected readonly options = CONTRIBUTION_TOP_OPTIONS;
  protected readonly top = computed(() => contributionSettings(this.draft()()).topContributors);
}
