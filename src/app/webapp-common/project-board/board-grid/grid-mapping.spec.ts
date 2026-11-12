import {BoardCard} from '../board.model';
import {fromGridNodes, keyStep, toGridNode} from './grid-mapping';

const card = (id: string, over: Partial<BoardCard> = {}): BoardCard =>
  ({id, type: 'plot', x: 0, y: 0, w: 3, h: 12, settings: {mine: id}, ...over});

describe('toGridNode', () => {
  it('has the id and the geometry of the card, nothing else', () => {
    expect(toGridNode(card('a', {x: 3, y: 4}))).toEqual({id: 'a', x: 3, y: 4, w: 3, h: 12});
  });
});

describe('fromGridNodes', () => {
  it('updates only the geometry: type and settings of the card survive', () => {
    const result = fromGridNodes([{id: 'a', x: 3, y: 12, w: 3, h: 12}], [card('a')]);
    expect(result).toEqual([card('a', {x: 3, y: 12})]);
  });

  it('keeps the order of the cards it was given and ignores a node it does not know', () => {
    const result = fromGridNodes([{id: 'b', x: 3, y: 0, w: 3, h: 12}, {id: 'ghost', x: 0, y: 0, w: 1, h: 4}, {id: 'a', x: 0, y: 0, w: 3, h: 12}],
      [card('a'), card('b')]);
    expect(result.map(c => c.id)).toEqual(['a', 'b']);
  });

  it('keeps a card the grid did not report as it was', () => {
    expect(fromGridNodes([], [card('a')])).toEqual([card('a')]);
  });

  it('rounds the height of a card to whole tiles, and leaves a divider one row high', () => {
    const rounded = fromGridNodes([{id: 'a', x: 0, y: 0, w: 3, h: 9}, {id: 'd', x: 0, y: 12, w: 6, h: 2}], [card('a'), card('d', {type: 'divider', h: 1, w: 6, y: 12})]);
    expect(rounded[0].h).toBe(8);
    expect(rounded[1].h).toBe(1);
  });

  it('keeps a card inside the columns and at least one tile high', () => {
    const [fixed] = fromGridNodes([{id: 'a', x: 5, y: 0, w: 3, h: 1}], [card('a')]);
    expect(fixed.x + fixed.w).toBeLessThanOrEqual(6);
    expect(fixed.h).toBe(4);
  });
});

describe('keyStep', () => {
  it('moves a card one tile with the arrow keys', () => {
    expect(keyStep(card('a', {x: 1, y: 4}), 'ArrowLeft', false)).toEqual({x: 0});
    expect(keyStep(card('a', {x: 1, y: 4}), 'ArrowRight', false)).toEqual({x: 2});
    expect(keyStep(card('a', {x: 1, y: 4}), 'ArrowUp', false)).toEqual({y: 0});
    expect(keyStep(card('a', {x: 1, y: 4}), 'ArrowDown', false)).toEqual({y: 8});
  });

  it('does not move a card out of the grid', () => {
    expect(keyStep(card('a', {x: 0}), 'ArrowLeft', false)).toBeNull();
    expect(keyStep(card('a', {x: 3, w: 3}), 'ArrowRight', false)).toBeNull();
    expect(keyStep(card('a', {y: 0}), 'ArrowUp', false)).toBeNull();
  });

  it('resizes by one tile with shift', () => {
    expect(keyStep(card('a', {w: 3, h: 12}), 'ArrowRight', true)).toEqual({w: 4});
    expect(keyStep(card('a', {w: 3, h: 12}), 'ArrowLeft', true)).toEqual({w: 2});
    expect(keyStep(card('a', {w: 3, h: 12}), 'ArrowDown', true)).toEqual({h: 16});
    expect(keyStep(card('a', {w: 3, h: 12}), 'ArrowUp', true)).toEqual({h: 8});
    expect(keyStep(card('a', {w: 1, h: 4}), 'ArrowLeft', true)).toBeNull();
    expect(keyStep(card('a', {h: 4}), 'ArrowUp', true)).toBeNull();
  });

  it('moves a divider one row, and never makes it taller', () => {
    const divider = card('d', {type: 'divider', h: 1, w: 6, y: 5});
    expect(keyStep(divider, 'ArrowDown', false)).toEqual({y: 6});
    expect(keyStep(divider, 'ArrowDown', true)).toBeNull();
  });

  it('ignores other keys', () => {
    expect(keyStep(card('a'), 'Enter', false)).toBeNull();
  });
});
