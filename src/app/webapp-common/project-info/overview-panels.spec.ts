import {DEFAULT_OVERVIEW_PANELS, resolveOverviewPanels} from './overview-panels';

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
});
