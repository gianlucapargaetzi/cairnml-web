import {ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, signal} from '@angular/core';
import {AbstractControl, FormControl, ReactiveFormsModule, ValidationErrors} from '@angular/forms';
import {lastValueFrom} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {Project} from '~/business-logic/model/projects/project';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {isReadOnly} from '@common/shared/utils/is-read-only';
import {ProjectSettingsStore} from '~/features/dashboard-search/project-settings-dashboard-search-permissions.store';

/** Same rule as the server's project admin check: a company admin, the owner, or a collaborator member. */
export function httpsUrlValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '').trim();
  if (!value) {
    return null;
  }
  if (!/^https:\/\//i.test(value)) {
    return {notHttps: true};
  }
  try {
    const url = new URL(value);
    return url.hostname && !url.username && !url.password ? null : {invalidUrl: true};
  } catch {
    return {invalidUrl: true};
  }
}

/**
 * The task notification webhook of a project: one https address that the server posts to when a task completes,
 * fails or is stopped. Only project admins change it. The stored address is not returned, so the field starts empty.
 */
@Component({
  selector: 'sm-project-notifications',
  templateUrl: './project-notifications.component.html',
  styleUrls: ['./project-notifications.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInput, MatButton]
})
export class ProjectNotificationsComponent {
  private projectsApi = inject(ApiProjectsService);
  private dialog = inject(MatDialog);
  private settingsStore = inject(ProjectSettingsStore);

  project = input.required<Project>();

  protected readonly control = new FormControl('', {nonNullable: true, validators: [httpsUrlValidator]});
  /** Whether a webhook is set: the server reports it, never the address. Updated after a save. */
  protected readonly hasWebhook = linkedSignal(() => !!this.project().has_notification_webhook);
  protected readonly busy = signal(false);
  protected readonly error = signal<string>(null);
  protected readonly saved = signal(false);

  protected readonly locked = computed(() => isReadOnly(this.project()) || this.settingsStore.isReadOnly());
  protected readonly canAdmin = computed(() => this.settingsStore.canManageMembers());
  protected readonly disabled = computed(() => this.locked() || !this.canAdmin());

  protected errorMessage(): string {
    const errors = this.control.errors;
    if (errors?.notHttps) {
      return 'The address must start with https://, for example https://hooks.example.com/cairnml';
    }
    if (errors?.invalidUrl) {
      return 'Enter a complete address, for example https://hooks.example.com/cairnml';
    }
    return '';
  }

  protected save() {
    if (this.control.invalid) {
      this.control.markAsTouched();
      return;
    }
    this.send(this.control.value.trim());
  }

  protected clear() {
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(ConfirmDialogComponent, {
      data: {
        title: 'Remove webhook?',
        body: 'The server stops posting task updates to this address.',
        yes: 'Remove',
        no: 'Cancel',
        iconClass: 'al-ico-dialog-x',
        destructive: true,
      },
      panelClass: 'dialog-sm',
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.send('');
      }
    });
  }

  private async send(value: string) {
    this.error.set(null);
    this.saved.set(false);
    this.busy.set(true);
    try {
      await lastValueFrom(this.projectsApi.projectsUpdate({project: this.project().id, notification_webhook: value}));
      this.hasWebhook.set(value !== '');
      this.control.reset('');
      this.saved.set(true);
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? error?.message ?? 'The webhook could not be saved.');
    } finally {
      this.busy.set(false);
    }
  }
}
