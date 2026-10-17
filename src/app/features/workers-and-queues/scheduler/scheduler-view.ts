/** Shared view types and helpers for the Workers and Jobs pages. */

export interface StatCard {
  label: string;
  value: string;
  caption: string;
}

export interface ResourceStat {
  label: string;
  /** percent of the machine (or limit) actually used */
  used: number;
  /** percent of the machine promised to jobs */
  allocated: number;
  caption: string;
}

export interface GpuBlock {
  index: number;
  label: string;
  busy: boolean;
}

/** The colour class for a worker or job state; the colours themselves come from the theme. */
export const stateClass = (state: string): string => {
  switch (state) {
    case 'active':
    case 'running':
      return 'state-ok';
    case 'draining':
    case 'pending':
      return 'state-warn';
    case 'lost':
    case 'failed':
      return 'state-bad';
    default:
      return 'state-idle';
  }
};

/** "12 s ago", "4 min ago", "3 h ago", "2 d ago". */
export const sinceText = (iso: string | null | undefined): string => {
  if (!iso) {
    return '–';
  }
  const seconds = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
  if (seconds < 60) {
    return `${seconds} s ago`;
  }
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)} min ago`;
  }
  if (seconds < 86400) {
    return `${Math.round(seconds / 3600)} h ago`;
  }
  return `${Math.round(seconds / 86400)} d ago`;
};
