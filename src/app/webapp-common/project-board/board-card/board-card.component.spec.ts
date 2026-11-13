import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BoardCard} from '../board.model';
import {CARD_TYPES} from '../card-registry';
import {BoardCardComponent} from './board-card.component';

const card = (over: Partial<BoardCard> = {}): BoardCard => ({id: 'a', type: 'divider', x: 0, y: 0, w: 6, h: 1, settings: {title: 'Results'}, ...over});

describe('BoardCardComponent', () => {
  let fixture: ComponentFixture<BoardCardComponent>;

  const create = async (cardValue: BoardCard, editing: boolean) => {
    fixture = TestBed.createComponent(BoardCardComponent);
    fixture.componentRef.setInput('card', cardValue);
    fixture.componentRef.setInput('projectId', 'p1');
    fixture.componentRef.setInput('editing', editing);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  const control = (root: HTMLElement, id: string) => root.querySelector(`[data-id="${id}"]`);

  it('shows no controls outside edit mode', async () => {
    const root = await create(card(), false);
    for (const id of ['boardCardMove', 'boardCardEdit', 'boardCardRemove']) {
      expect(control(root, id)).toBeNull();
    }
    expect(root.querySelector('[data-id=boardDivider]')?.textContent).toContain('Results');
  });

  it('shows the handle and the trash in edit mode, and the pen only for a type that has settings', async () => {
    const original = CARD_TYPES['divider'].settings;
    try {
      CARD_TYPES['divider'].settings = undefined;
      let root = await create(card(), true);
      expect(control(root, 'boardCardMove')).not.toBeNull();
      expect(control(root, 'boardCardRemove')).not.toBeNull();
      expect(control(root, 'boardCardEdit')).toBeNull();
      TestBed.resetTestingModule();
      CARD_TYPES['divider'].settings = () => Promise.resolve(class {});
      root = await create(card(), true);
      expect(control(root, 'boardCardEdit')).not.toBeNull();
    } finally {
      CARD_TYPES['divider'].settings = original;
    }
  });

  it('says so when its type has no body in this version', async () => {
    const original = CARD_TYPES['plot'].body;
    try {
      CARD_TYPES['plot'].body = undefined;
      const root = await create(card({type: 'plot', h: 12, w: 3, settings: {}}), false);
      await fixture.whenStable();
      fixture.detectChanges();
      expect(root.querySelector('[data-id=boardCardUnavailable]')).not.toBeNull();
    } finally {
      CARD_TYPES['plot'].body = original;
    }
  });

  it('emits remove from the trash and edit from the pen', async () => {
    const original = CARD_TYPES['divider'].settings;
    try {
      CARD_TYPES['divider'].settings = () => Promise.resolve(class {});
      const root = await create(card(), true);
      const events: string[] = [];
      fixture.componentInstance.remove.subscribe(() => events.push('remove'));
      fixture.componentInstance.edit.subscribe(() => events.push('edit'));
      (control(root, 'boardCardRemove') as HTMLButtonElement).click();
      (control(root, 'boardCardEdit') as HTMLButtonElement).click();
      expect(events).toEqual(['remove', 'edit']);
    } finally {
      CARD_TYPES['divider'].settings = original;
    }
  });
});
