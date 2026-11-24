import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ErrorHandler} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {CARD_TYPES} from '../card-registry';
import {CardSettingsDialogComponent} from './card-settings-dialog.component';

describe('CardSettingsDialogComponent when the settings of the card cannot be loaded', () => {
  let reported: unknown[];
  let fixture: ComponentFixture<CardSettingsDialogComponent>;
  let original: (typeof CARD_TYPES)['plot']['settings'];

  beforeEach(async () => {
    reported = [];
    original = CARD_TYPES['plot'].settings;
    CARD_TYPES['plot'].settings = () => Promise.reject(new Error('chunk failed'));
    await TestBed.configureTestingModule({
      imports: [CardSettingsDialogComponent],
      providers: [
        {provide: MAT_DIALOG_DATA, useValue: {card: {id: 'a', type: 'plot', x: 0, y: 0, w: 3, h: 12, settings: {}}, projectId: 'p1'}},
        {provide: MatDialogRef, useValue: {close: () => undefined}},
        {provide: ErrorHandler, useValue: {handleError: (e: unknown) => reported.push(e)}},
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CardSettingsDialogComponent);
  });

  afterEach(() => {
    CARD_TYPES['plot'].settings = original;
  });

  it('shows the note with Cancel and Apply, and reports nothing', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-id="cardSettingsError"]')?.textContent).toContain('The settings of this card could not be loaded.');
    expect(el.querySelector('[data-id="CancelButton"]')).not.toBeNull();
    expect(el.querySelector('[data-id="ApplyCardSettingsButton"]')).not.toBeNull();
    expect(reported).toEqual([]);
  });
});
