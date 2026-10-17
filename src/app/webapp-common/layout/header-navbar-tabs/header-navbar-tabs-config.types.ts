export interface HeaderNavbarTabConfig {
  header: string;
  /** Text shown on the tab; defaults to `header`. The header key stays the route's name. */
  label?: string;
  subHeader?: string;
  badge?: string;
  badgeTooltip?: string;
  permissionCheck?: string;
  link?: string | string[];
  featureLink?: string;
  featureName?: string;
  id?: string;
  queryParams?: Record<string, string>;
  counters?: {icon: string; value: string; tooltip?: string}[];
}
