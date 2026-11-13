import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {MatDialogClose, MatDialogRef} from '@angular/material/dialog';
import {MatIcon} from '@angular/material/icon';
import {MatRadioButton, MatRadioGroup} from '@angular/material/radio';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {BoardCardType} from '../board.model';
import {CARD_TYPE_LIST} from '../card-registry';

/** Chooses the type of a new card. Closes with the type, or with nothing when cancelled. */
@Component({
  selector: 'sm-add-card-dialog',
  templateUrl: './add-card-dialog.component.html',
  styleUrls: ['./add-card-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogTemplateComponent, MatButton, MatDialogClose, MatIcon, MatRadioButton, MatRadioGroup],
})
export class AddCardDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<AddCardDialogComponent, BoardCardType>);
  protected readonly types = CARD_TYPE_LIST;
  protected readonly selected = signal<BoardCardType | null>(null);

  protected add(): void {
    const type = this.selected();
    if (type) {
      this.dialogRef.close(type);
    }
  }
}
