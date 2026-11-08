import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialog, MatDialogClose, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {lastValueFrom} from 'rxjs';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {RepoAccessBadgeComponent} from '@common/shared/ui-components/data/repo-access-badge/repo-access-badge.component';
import {RepoAccess, RepoAccessService} from '@common/shared/services/repo-access.service';
import {DatasetAccessService} from '../dataset-git/dataset-access.service';
import {assignCredentials} from '../dataset-credential-dialog/assign-credentials';

export interface DispatchWarningData {
  rows: RepoAccess[];
  // the tasks being dispatched, to read the requirement again after a credential is assigned
  tasks: string[];
}

// Shown before a dispatch when a repository has no credential assigned and the company's access does not reach it.
// "Run anyway" clones a repository the host allows to be read without a credential, and fails for a private one, so it
// is offered only while every repository can be read that way. "Assign credentials" opens the assignment for the one who
// may; once every repository has an assignment the dispatch goes on.
@Component({
  selector: 'sm-dispatch-warning-dialog',
  templateUrl: './dispatch-warning-dialog.component.html',
  styleUrls: ['./dispatch-warning-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatButtonModule, MatCheckboxModule, DialogTemplateComponent, MatDialogClose, RepoAccessBadgeComponent],
})
export class DispatchWarningDialogComponent {
  private dialog = inject(MatDialog);
  private repoAccess = inject(RepoAccessService);
  private access = inject(DatasetAccessService);
  private dialogRef = inject(MatDialogRef<DispatchWarningDialogComponent, boolean>);
  private data = inject<DispatchWarningData>(MAT_DIALOG_DATA);

  protected readonly rows = signal<RepoAccess[]>(this.data.rows);
  protected readonly pending = computed(() => this.rows().filter(row => row.ask));
  // a repository that is private or cannot be reached cannot be run anyway: it needs an assignment first
  protected readonly canRunAnyway = computed(() => this.pending().every(row => row.state !== 'unreachable'));
  protected dontAskAgain = false;
  protected readonly saving = signal(false);

  protected hasPublic(): boolean {
    return this.pending().some(row => row.state === 'anonymous' && row.can_assign);
  }

  protected explanation(row: RepoAccess): string {
    switch (row.state) {
      case 'anonymous': return 'It is public, so it can be cloned without a credential.';
      case 'unknown': return 'The host could not be asked whether it is public.';
      case 'unreachable': return 'It is private and no credential reaches it.';
      default: return row.message;
    }
  }

  protected assign(row: RepoAccess): void {
    assignCredentials(this.dialog, this.access, row).subscribe(saved => {
      if (saved) {
        this.reload();
      }
    });
  }

  private reload(): void {
    this.repoAccess.requirement(this.data.tasks).subscribe(rows => {
      this.rows.set(rows);
      if (!rows.some(row => row.ask)) {
        this.dialogRef.close(true);
      }
    });
  }

  protected async run(): Promise<void> {
    if (this.dontAskAgain) {
      // "don't ask again" marks the public repositories as not needing a credential, for the projects the user may assign
      this.saving.set(true);
      try {
        for (const row of this.pending().filter(item => item.state === 'anonymous' && item.can_assign)) {
          await lastValueFrom(this.access.setBindingCredential(row.binding, null, true));
        }
      } catch {
        // the dispatch goes on: the assignment is a convenience
      } finally {
        this.saving.set(false);
      }
    }
    this.dialogRef.close(true);
  }
}
