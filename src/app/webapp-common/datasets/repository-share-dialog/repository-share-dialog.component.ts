import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogClose, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatIcon} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {Store} from '@ngrx/store';
import {lastValueFrom} from 'rxjs';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {addMessage} from '@common/core/actions/layout.actions';
import {MESSAGES_SEVERITY} from '@common/constants';
import {Repo, RepoCredentialChoice, RepositoriesService} from '../dataset-git/repositories.service';

interface CheckState {
  state: 'idle' | 'checking' | 'ok' | 'refused';
  message: string;
}

// Makes a repository shared. The company credential that reads it is chosen and its access is checked first; only when the access
// is confirmed can the repository be shared, and then once more after an "are you sure".
@Component({
  selector: 'sm-repository-share-dialog',
  templateUrl: './repository-share-dialog.component.html',
  styleUrls: ['./repository-share-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatFormFieldModule, MatSelectModule, MatIcon, MatProgressSpinnerModule, DialogTemplateComponent, MatDialogClose],
})
export class RepositoryShareDialogComponent {
  private repositories = inject(RepositoriesService);
  private dialog = inject(MatDialog);
  private store = inject(Store);
  private dialogRef = inject(MatDialogRef<RepositoryShareDialogComponent, boolean>);
  protected readonly repo = inject<{ repo: Repo }>(MAT_DIALOG_DATA).repo;

  protected readonly companyCredentials: RepoCredentialChoice[] = this.repo.credentials.filter(credential => credential.company);
  protected readonly choice = signal<string | null>(null);
  protected readonly check = signal<CheckState>({state: 'idle', message: ''});
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  private checkId = 0;

  protected choose(value: string): void {
    this.choice.set(value);
    this.error.set(null);
    const id = ++this.checkId;
    this.check.set({state: 'checking', message: ''});
    const noneNeeded = value === 'none';
    this.repositories.checkSharing(this.repo.id, noneNeeded ? undefined : value, noneNeeded).subscribe({
      next: answer => id === this.checkId && this.check.set({state: answer.ok ? 'ok' : 'refused', message: answer.message}),
      error: error => id === this.checkId && this.check.set({state: 'refused', message: error?.meta?.result_msg ?? 'The access could not be checked.'}),
    });
  }

  protected share(): void {
    const value = this.choice();
    if (!value || this.check().state !== 'ok' || this.saving()) {
      return;
    }
    const data: ConfirmDialogConfig = {
      title: 'Are you sure?',
      body: `${this.repo.host}/${this.repo.path} becomes shared: visible to every user, owned by the admin and read with the company credential. ` +
        'Other credential assignments are dropped. Only the admin can make it non-shared again.',
      yes: 'Make shared', no: 'Cancel', iconClass: 'al-ico-alert', iconColor: 'var(--color-warning)', destructive: false,
    };
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(ConfirmDialogComponent, {data, panelClass: 'dialog-sm'})
      .afterClosed().subscribe(async confirmed => {
        if (!confirmed) {
          return;
        }
        this.saving.set(true);
        try {
          await lastValueFrom(this.repositories.setShared(this.repo.id, true, value === 'none' ? undefined : value, value === 'none'));
          this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, `${this.repo.name} is shared`));
          this.dialogRef.close(true);
        } catch (error) {
          this.error.set(error?.meta?.result_msg ?? 'The repository could not be shared.');
        } finally {
          this.saving.set(false);
        }
      });
  }
}
