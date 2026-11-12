import {Board} from './board.model';

/**
 * The board a project shows until its owner changes it: the content of the overview as it was, one card for each of its panels, at
 * fixed places. It is made here and not stored; the owner's first edit saves it. A new board is returned every time.
 */
export function defaultBoard(): Board {
  return {
    version: 0,
    cards: [
      {id: 'project-state', type: 'project-state', x: 0, y: 0, w: 3, h: 12, settings: {}},
      {id: 'contributions', type: 'contributions', x: 3, y: 0, w: 3, h: 12, settings: {periodDays: 365, topContributors: 5}},
      {id: 'metric-snapshot', type: 'metric-snapshot', x: 0, y: 12, w: 6, h: 12, settings: {}},
      {id: 'recent-tasks', type: 'recent-tasks', x: 0, y: 24, w: 6, h: 16, settings: {}},
      {id: 'description', type: 'description', x: 0, y: 40, w: 6, h: 16, settings: {}},
    ],
  };
}
