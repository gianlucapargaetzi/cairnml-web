/** How many contributors the ranking of a contributions card may list. */
export const CONTRIBUTION_TOP_OPTIONS = [5, 10, 20] as const;

export interface ContributionSettings {
  topContributors: number;
}

/** The settings of a contributions card, with anything that is missing or not one of the options replaced by the default (5). */
export function contributionSettings(raw: Record<string, unknown> | null | undefined): ContributionSettings {
  const top = raw?.['topContributors'];
  return {topContributors: (CONTRIBUTION_TOP_OPTIONS as readonly unknown[]).includes(top) ? top as number : CONTRIBUTION_TOP_OPTIONS[0]};
}
