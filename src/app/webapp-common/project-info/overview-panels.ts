/**
 * The panels of the project overview, in the order they are rendered.
 *
 * The layout is stored per user and project in the user preferences (see `OverviewSettingsService`).
 * `resolveOverviewPanels` drops unknown panel ids and appends missing panels hidden, so a project without a
 * saved layout keeps the default page.
 */
export const OVERVIEW_PANEL_IDS = ['metric-snapshot', 'description', 'project-state', 'recent-experiments', 'contribution'] as const;

export type OverviewPanelId = typeof OVERVIEW_PANEL_IDS[number];

export const OVERVIEW_PANEL_LABELS: Record<OverviewPanelId, string> = {
  'metric-snapshot': 'Metric Snapshot',
  'description': 'Project overview',
  'project-state': 'Project state',
  'recent-experiments': 'Recent tasks',
  'contribution': 'Contributions'
};

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

export interface OverviewSettings {
  panels: OverviewPanelSetting[];
  contribution: ContributionPanelOptions;
}

export const CONTRIBUTION_PERIOD_OPTIONS = [7, 30, 365] as const;
export const CONTRIBUTION_TOP_OPTIONS = [5, 10, 20] as const;

export const DEFAULT_OVERVIEW_PANELS: OverviewPanelSetting[] = [
  {id: 'metric-snapshot', shown: true},
  {id: 'description', shown: true},
  {id: 'project-state', shown: false},
  {id: 'recent-experiments', shown: false},
  {id: 'contribution', shown: false}
];

export const DEFAULT_CONTRIBUTION_OPTIONS: ContributionPanelOptions = {
  periodDays: 30,
  topContributors: 5
};

const isKnownPanelId = (id: unknown): id is OverviewPanelId => (OVERVIEW_PANEL_IDS as readonly unknown[]).includes(id);

export function resolveOverviewPanels(saved?: OverviewPanelSetting[] | null): OverviewPanelSetting[] {
  const resolved: OverviewPanelSetting[] = [];
  for (const entry of Array.isArray(saved) ? saved : []) {
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

/** Moves one panel up (`-1`) or down (`1`). Panels at the edge stay where they are. */
export function moveOverviewPanel(panels: OverviewPanelSetting[], id: OverviewPanelId, direction: -1 | 1): OverviewPanelSetting[] {
  const index = panels.findIndex(panel => panel.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= panels.length) {
    return panels.map(panel => ({...panel}));
  }
  const moved = panels.map(panel => ({...panel}));
  [moved[index], moved[target]] = [moved[target], moved[index]];
  return moved;
}

function pickAllowed(value: unknown, allowed: readonly number[], fallback: number): number {
  return allowed.includes(value as number) ? value as number : fallback;
}

export function resolveContributionOptions(saved?: Partial<ContributionPanelOptions> | null): ContributionPanelOptions {
  return {
    periodDays: pickAllowed(saved?.periodDays, CONTRIBUTION_PERIOD_OPTIONS, DEFAULT_CONTRIBUTION_OPTIONS.periodDays),
    topContributors: pickAllowed(saved?.topContributors, CONTRIBUTION_TOP_OPTIONS, DEFAULT_CONTRIBUTION_OPTIONS.topContributors)
  };
}

export function resolveOverviewSettings(saved?: Partial<OverviewSettings> | null): OverviewSettings {
  return {
    panels: resolveOverviewPanels(saved?.panels),
    contribution: resolveContributionOptions(saved?.contribution)
  };
}
