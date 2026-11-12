import {ChangeDetectionStrategy, Component, computed, input, WritableSignal} from '@angular/core';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

/** The settings form of a divider: its title. */
@Component({
  selector: 'sm-divider-settings',
  template: `
    <mat-form-field appearance="outline" class="w-100">
      <mat-label>Title</mat-label>
      <input matInput maxlength="80" [value]="title()" (input)="draft().set({title: $any($event.target).value})" data-id="dividerTitle">
    </mat-form-field>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormField, MatLabel, MatInput],
})
export class DividerSettingsComponent {
  readonly draft = input.required<WritableSignal<Record<string, unknown>>>();
  readonly projectId = input<string>();
  protected readonly title = computed(() => String(this.draft()()['title'] ?? ''));
}
