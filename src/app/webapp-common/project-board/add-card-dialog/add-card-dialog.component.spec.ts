import {TestBed} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {BOARD_CARD_TYPES} from '../board.model';
import {AddCardDialogComponent} from './add-card-dialog.component';

describe('AddCardDialogComponent', () => {
  const setup = async () => {
    const closed: unknown[] = [];
    await TestBed.configureTestingModule({
      imports: [AddCardDialogComponent],
      providers: [{provide: MatDialogRef, useValue: {close: (value: unknown) => closed.push(value)}}],
    }).compileComponents();
    const fixture = TestBed.createComponent(AddCardDialogComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return {fixture, root: fixture.nativeElement as HTMLElement, closed};
  };

  it('lists every card type once', async () => {
    const {root} = await setup();
    const ids = Array.from(root.querySelectorAll('[data-id^="addCardType-"]')).map(element => element.getAttribute('data-id'));
    expect(ids.sort()).toEqual(BOARD_CARD_TYPES.map(type => `addCardType-${type}`).sort());
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has the add button disabled until a type is chosen, and closes with that type', async () => {
    const {fixture, root, closed} = await setup();
    const add = root.querySelector('[data-id=AddCardButton]') as HTMLButtonElement;
    expect(add.disabled).toBeTrue();
    (root.querySelector('[data-id="addCardType-plot"] input') as HTMLInputElement).click();
    fixture.detectChanges();
    expect(add.disabled).toBeFalse();
    add.click();
    expect(closed).toEqual(['plot']);
  });
});
