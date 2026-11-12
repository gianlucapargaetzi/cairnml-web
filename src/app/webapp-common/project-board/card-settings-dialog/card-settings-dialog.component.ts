import {ChangeDetectionStrategy, Component, inject, resource, signal} from '@angular/core';
import {NgComponentOutlet} from '@angular/common';
import {MatButton} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogClose, MatDialogRef} from '@angular/material/dialog';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {BoardCard} from '../board.model';
import {CARD_TYPES} from '../card-registry';

/**
 * The settings of one card. The settings component of the card's type (see the card registry) edits a copy through the `draft`
 * signal it is given; Apply closes with that copy, Cancel with nothing.
 */
@Component({
  selector: 'sm-card-settings-dialog',
  templateUrl: './card-settings-dialog.component.html',
  styleUrls: ['./card-settings-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogTemplateComponent, MatButton, MatDialogClose, NgComponentOutlet],
})
export class CardSettingsDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CardSettingsDialogComponent, Record<string, unknown>>);
  protected readonly data = inject<{card: BoardCard; projectId: string}>(MAT_DIALOG_DATA);
  protected readonly def = CARD_TYPES[this.data.card.type];
  protected readonly draft = signal<Record<string, unknown>>({...this.data.card.settings});
  protected readonly inputs = {draft: this.draft, projectId: this.data.projectId};
  protected readonly component = resource({loader: async () => (await this.def.settings?.()) ?? null});

  protected apply(): void {
    this.dialogRef.close(this.draft());
  }
}
