import {CARD_TYPES} from '../card-registry';
import {contributionSettings} from './contribution-settings';

describe('the cards of the old overview', () => {
  it('each has a body, and the contributions card has settings', async () => {
    for (const type of ['project-state', 'recent-tasks', 'metric-snapshot', 'contributions', 'description'] as const) {
      const def = CARD_TYPES[type];
      expect(def.body).withContext(type).toBeDefined();
      expect(await def.body!()).withContext(type).toBeDefined();
      expect(def.bare).withContext(type).toBeTrue();
    }
    expect(CARD_TYPES['contributions'].settings).toBeDefined();
    expect(CARD_TYPES['project-state'].settings).toBeUndefined();
  });

  it('contribution settings fall back to the default for anything that is not an option', () => {
    expect(contributionSettings({topContributors: 10})).toEqual({topContributors: 10});
    expect(contributionSettings({topContributors: 7})).toEqual({topContributors: 5});
    expect(contributionSettings({topContributors: '10'})).toEqual({topContributors: 5});
    expect(contributionSettings(undefined)).toEqual({topContributors: 5});
  });
});
