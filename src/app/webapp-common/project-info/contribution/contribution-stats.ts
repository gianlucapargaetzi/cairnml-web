/** One run as the contribution panel needs it. */
export interface ContributionRun {
  created: Date;
  status: string;
  userId: string;
  userName: string;
}

export interface ContributionDay {
  date: Date;
  runs: number;
  /** 0 (no runs) to 4 (the busiest day of the period). */
  level: number;
}

export interface ContributionContributor {
  id: string;
  name: string;
  runs: number;
}

export interface ContributionSummary {
  total: number;
  completed: number;
  failed: number;
  running: number;
  days: ContributionDay[];
  /** Empty cells before the first day so that each grid row is one weekday (Monday first). */
  leadingBlanks: number[];
  contributors: ContributionContributor[];
  /** Number of contributors in the period, before the ranking is cut to the top ones. */
  contributorCount: number;
}

const RUNNING_STATUSES = ['in_progress', 'queued'];
const UNKNOWN_USER = 'Unknown user';

/**
 * The counts of the period as the server computes them (`projects.get_contributions`). Days are local calendar
 * days (`YYYY-MM-DD`) in the time zone the request gave, and only days with runs are listed.
 */
export interface ContributionAggregate {
  period_days: number;
  total: number;
  completed: number;
  failed: number;
  running: number;
  days: {date: string; runs: number}[];
  contributors: {id: string; name: string; runs: number}[];
  contributor_count: number;
}

/** Local calendar day start, so that a run belongs to the day the user saw it on. */
export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Start of the period: the first day of the last `periodDays` days, today included. */
export function periodStart(now: Date, periodDays: number): Date {
  const start = startOfLocalDay(now);
  start.setDate(start.getDate() - (periodDays - 1));
  return start;
}

/** Local calendar day as `YYYY-MM-DD`, the key of `ContributionAggregate.days`. */
export function localDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Minutes east of UTC of the local time zone, the value the server needs to assign runs to local days. */
export function utcOffsetMinutes(date: Date): number {
  return -date.getTimezoneOffset();
}

/** One column of the activity grid: seven cells, Monday first; `null` is an empty cell outside the period. */
export interface ContributionWeek {
  cells: (ContributionDay | null)[];
  /** The month name, on the first week that starts in a new month. */
  monthLabel: string | null;
}

/** Longest period the server counts. */
export const MAX_PERIOD_DAYS = 365;

/**
 * Days from the Monday that starts the first of `columns` weeks up to today: the period the activity grid shows, with
 * the tiles and the ranking counting the same runs as the grid. Capped at the longest period the server counts.
 */
export function periodDaysFor(columns: number, today: Date): number {
  const daysSinceMonday = (startOfLocalDay(today).getDay() + 6) % 7;
  return Math.min(MAX_PERIOD_DAYS, (columns - 1) * 7 + daysSinceMonday + 1);
}

/**
 * The last `columns` weeks, Monday first, ending with the week of `today`. Days after today are empty cells, and so are
 * days before the period the data covers. Each week is one column of the grid.
 */
export function buildWeeks(days: ContributionDay[], columns: number, today: Date): ContributionWeek[] {
  const byDay = new Map(days.map(day => [localDayKey(day.date), day]));
  const todayStart = startOfLocalDay(today);
  const daysSinceMonday = (todayStart.getDay() + 6) % 7;
  const firstMonday = new Date(
    todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate() - daysSinceMonday - (columns - 1) * 7
  );

  const weeks: ContributionWeek[] = [];
  let shownMonth = -1;
  for (let column = 0; column < columns; column++) {
    const cells: (ContributionDay | null)[] = [];
    for (let row = 0; row < 7; row++) {
      const date = new Date(firstMonday.getFullYear(), firstMonday.getMonth(), firstMonday.getDate() + column * 7 + row);
      cells.push(date > todayStart ? null : byDay.get(localDayKey(date)) ?? null);
    }
    const firstOfWeek = new Date(firstMonday.getFullYear(), firstMonday.getMonth(), firstMonday.getDate() + column * 7);
    let monthLabel: string | null = null;
    if (firstOfWeek.getMonth() !== shownMonth) {
      shownMonth = firstOfWeek.getMonth();
      monthLabel = firstOfWeek.toLocaleDateString(undefined, {month: 'short'});
    }
    weeks.push({cells, monthLabel});
  }
  return weeks;
}

function levelDays(days: ContributionDay[]) {
  const busiest = Math.max(0, ...days.map(day => day.runs));
  for (const day of days) {
    day.level = day.runs === 0 ? 0 : Math.min(4, Math.ceil((day.runs / busiest) * 4));
  }
}

/** Same summary as `buildContributionSummary`, from the counts the server computed. */
export function buildContributionSummaryFromAggregate(
  aggregate: ContributionAggregate, now: Date, periodDays: number, topContributors: number
): ContributionSummary {
  const start = periodStart(now, periodDays);
  const runsByDay = new Map(aggregate.days.map(day => [day.date, day.runs]));
  const days: ContributionDay[] = [];
  for (let i = 0; i < periodDays; i++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    days.push({date, runs: runsByDay.get(localDayKey(date)) ?? 0, level: 0});
  }
  levelDays(days);

  return {
    total: aggregate.total,
    completed: aggregate.completed,
    failed: aggregate.failed,
    running: aggregate.running,
    days,
    leadingBlanks: Array.from({length: (start.getDay() + 6) % 7}, (_, i) => i),
    contributors: aggregate.contributors.slice(0, topContributors).map(contributor => ({
      id: contributor.id,
      name: contributor.name || UNKNOWN_USER,
      runs: contributor.runs
    })),
    contributorCount: aggregate.contributor_count
  };
}

export function buildContributionSummary(
  runs: ContributionRun[], now: Date, periodDays: number, topContributors: number
): ContributionSummary {
  const start = periodStart(now, periodDays);
  const dayIndex = (date: Date) => Math.round((startOfLocalDay(date).getTime() - start.getTime()) / 86400000);

  const days: ContributionDay[] = [];
  for (let i = 0; i < periodDays; i++) {
    days.push({date: new Date(start.getFullYear(), start.getMonth(), start.getDate() + i), runs: 0, level: 0});
  }

  const leadingBlanks = Array.from({length: (start.getDay() + 6) % 7}, (_, i) => i);

  const byUser = new Map<string, {name: string; runs: number}>();
  let completed = 0;
  let failed = 0;
  let running = 0;
  let total = 0;

  for (const run of runs) {
    if (run.created < start) {
      continue;
    }
    total++;
    if (run.status === 'completed') {
      completed++;
    } else if (run.status === 'failed') {
      failed++;
    } else if (RUNNING_STATUSES.includes(run.status)) {
      running++;
    }
    const index = dayIndex(run.created);
    if (index >= 0 && index < days.length) {
      days[index].runs++;
    }
    const contributor = byUser.get(run.userId) ?? {name: run.userName, runs: 0};
    contributor.runs++;
    byUser.set(run.userId, contributor);
  }

  levelDays(days);

  const contributors = [...byUser.entries()]
    .map(([id, {name, runs}]) => ({id, name, runs}))
    .sort((a, b) => b.runs - a.runs || a.name.localeCompare(b.name));

  return {
    total,
    completed,
    failed,
    running,
    days,
    leadingBlanks,
    contributors: contributors.slice(0, topContributors),
    contributorCount: contributors.length
  };
}
