import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {CardComponent} from '@common/shared/ui-components/panel/card/card.component';

@Component({
  selector: 'sm-plus-card',
  templateUrl: './plus-card.component.html',
  styleUrls: ['./plus-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardComponent,
    MatIconModule
  ]
})
export class PlusCardComponent {
  folder = input(false);
  plusCardClick = output();

  public plusCardClicked() {
    this.plusCardClick.emit();
  }
}
