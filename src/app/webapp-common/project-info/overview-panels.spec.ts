import {
  DEFAULT_CONTRIBUTION_OPTIONS,
  DEFAULT_OVERVIEW_PANELS,
  moveOverviewPanel,
  resolveContributionOptions,
  resolveOverviewPanels,
  resolveOverviewSettings
} from './overview-panels';

describe('overview panels', () => {
  it('resolves to the default page when nothing is saved', () => {
    expect(resolveOverviewPanels(null)).toEqual(DEFAULT_OVERVIEW_PANELS);
    expect(resolveOverviewPanels(undefined)).toEqual(DEFAULT_OVERVIEW_PANELS);
  });

  it('keeps the default page visible: metric snapshot, then description, contribution hidden', () => {
    const shown = resolveOverviewPanels(null).filter(panel => panel.shown).map(panel => panel.id);
    expect(shown).toEqual(['metric-snapshot', 'description']);
  });

  it('keeps the saved order and visibility', () => {
    const saved = [
      {id: 'contribution' as const, shown: true},
      {id: 'description' as const, shown: false},
      {id: 'metric-snapshot' as const, shown: true}
    ];
    expect(resolveOverviewPanels(saved)).toEqual(saved);
  });

  it('drops unknown and duplicate panels and appends missing ones hidden', () => {
    const saved = [
      {id: 'unknown' as never, shown: true},
      {id: 'contribution' as const, shown: true},
      {id: 'contribution' as const, shown: false}
    ];
    expect(resolveOverviewPanels(saved)).toEqual([
      {id: 'contribution', shown: true},
      {id: 'metric-snapshot', shown: true},
      {id: 'description', shown: true}
    ]);
  });

  it('ignores a saved list that is not a list', () => {
    expect(resolveOverviewPanels({} as never)).toEqual(DEFAULT_OVERVIEW_PANELS);
  });

  it('moves a panel up and down and keeps the panels at the edges in place', () => {
    const panels = resolveOverviewPanels(null);
    expect(moveOverviewPanel(panels, 'description', -1).map(panel => panel.id))
      .toEqual(['description', 'metric-snapshot', 'contribution']);
    expect(moveOverviewPanel(panels, 'metric-snapshot', 1).map(panel => panel.id))
      .toEqual(['description', 'metric-snapshot', 'contribution']);
    expect(moveOverviewPanel(panels, 'metric-snapshot', -1)).toEqual(panels);
    expect(panels.map(panel => panel.id)).toEqual(['metric-snapshot', 'description', 'contribution']);
  });

  it('falls back to the default period and size for values the panel does not offer', () => {
    expect(resolveContributionOptions(null)).toEqual(DEFAULT_CONTRIBUTION_OPTIONS);
    expect(resolveContributionOptions({periodDays: 14, topContributors: 3})).toEqual(DEFAULT_CONTRIBUTION_OPTIONS);
    expect(resolveContributionOptions({periodDays: 365, topContributors: 10})).toEqual({periodDays: 365, topContributors: 10});
  });

  it('resolves a saved overview with a missing part to the default for that part', () => {
    expect(resolveOverviewSettings({panels: [{id: 'contribution', shown: true}]})).toEqual({
      panels: [
        {id: 'contribution', shown: true},
        {id: 'metric-snapshot', shown: true},
        {id: 'description', shown: true}
      ],
      contribution: DEFAULT_CONTRIBUTION_OPTIONS
    });
  });
});
