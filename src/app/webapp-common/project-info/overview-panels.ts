/**
 * The panels of the project overview, in the order they are rendered.
 *
 * A saved configuration (once the project settings store it) is resolved with `resolveOverviewPanels`:
 * unknown panel ids are dropped and missing panels are appended hidden, so a project without a saved
 * configuration keeps the default page.
 */
export const OVERVIEW_PANEL_IDS = ['metric-snapshot', 'description', 'contribution'] as const;

export type OverviewPanelId = typeof OVERVIEW_PANEL_IDS[number];

export interface OverviewPanelSetting {
  id: OverviewPanelId;
  shown: boolean;
}

export interface ContributionPanelOptions {
  /** Number of days, counting today, that the panel covers. */
  periodDays: number;
  /** Number of contributors listed in the ranking. */
  topContributors: number;
}

export const DEFAULT_OVERVIEW_PANELS: OverviewPanelSetting[] = [
  {id: 'metric-snapshot', shown: true},
  {id: 'description', shown: true},
  {id: 'contribution', shown: false}
];

export const DEFAULT_CONTRIBUTION_OPTIONS: ContributionPanelOptions = {
  periodDays: 30,
  topContributors: 5
};

const isKnownPanelId = (id: unknown): id is OverviewPanelId => (OVERVIEW_PANEL_IDS as readonly unknown[]).includes(id);

export function resolveOverviewPanels(saved?: OverviewPanelSetting[] | null): OverviewPanelSetting[] {
  const resolved: OverviewPanelSetting[] = [];
  for (const entry of saved ?? []) {
    if (isKnownPanelId(entry?.id) && !resolved.some(panel => panel.id === entry.id)) {
      resolved.push({id: entry.id, shown: !!entry.shown});
    }
  }
  for (const fallback of DEFAULT_OVERVIEW_PANELS) {
    if (!resolved.some(panel => panel.id === fallback.id)) {
      resolved.push({...fallback});
    }
  }
  return resolved;
}
