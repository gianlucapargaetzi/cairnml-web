import {
  buildContributionSummary,
  buildContributionSummaryFromAggregate,
  ContributionAggregate,
  ContributionRun,
  localDayKey,
  periodStart
} from './contribution-stats';

describe('contribution stats', () => {
  // Wednesday 2026-10-28, local time
  const now = new Date(2026, 9, 28, 15, 30);
  const runAt = (daysAgo: number, status: string, userName: string): ContributionRun => ({
    created: new Date(2026, 9, 28 - daysAgo, 9, 0),
    status,
    userId: `id-${userName}`,
    userName
  });

  it('starts the period on the first day of the window, today included', () => {
    expect(periodStart(now, 7)).toEqual(new Date(2026, 9, 22));
  });

  it('counts runs and their status inside the period only', () => {
    const runs = [
      runAt(0, 'completed', 'ana'),
      runAt(1, 'failed', 'ana'),
      runAt(2, 'in_progress', 'ben'),
      runAt(3, 'queued', 'ben'),
      runAt(10, 'completed', 'ana')
    ];
    const summary = buildContributionSummary(runs, now, 7, 5);
    expect(summary.total).toBe(4);
    expect(summary.completed).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.running).toBe(2);
  });

  it('builds one day per period day, oldest first, with the runs of each day', () => {
    const runs = [runAt(0, 'completed', 'ana'), runAt(0, 'completed', 'ana'), runAt(6, 'failed', 'ben')];
    const summary = buildContributionSummary(runs, now, 7, 5);
    expect(summary.days.length).toBe(7);
    expect(summary.days[0].date).toEqual(new Date(2026, 9, 22));
    expect(summary.days[6].runs).toBe(2);
    expect(summary.days[0].runs).toBe(1);
    expect(summary.days[6].level).toBe(4);
    expect(summary.days[0].level).toBe(2);
  });

  it('leaves the first week padded so that rows are weekdays, Monday first', () => {
    // 2026-10-22 is a Thursday: three empty cells before it
    expect(buildContributionSummary([], now, 7, 5).leadingBlanks.length).toBe(3);
  });

  it('ranks contributors by runs and cuts the list to the top ones', () => {
    const runs = [
      runAt(0, 'completed', 'ben'),
      runAt(1, 'completed', 'ana'),
      runAt(2, 'completed', 'ana'),
      runAt(3, 'completed', 'cy'),
      runAt(4, 'completed', 'dee')
    ];
    const summary = buildContributionSummary(runs, now, 7, 2);
    expect(summary.contributors).toEqual([
      {id: 'id-ana', name: 'ana', runs: 2},
      {id: 'id-ben', name: 'ben', runs: 1}
    ]);
    expect(summary.contributorCount).toBe(4);
  });

  it('renders an empty period without runs, days or contributors', () => {
    const summary = buildContributionSummary([], now, 30, 5);
    expect(summary.total).toBe(0);
    expect(summary.days.every(day => day.level === 0)).toBeTrue();
    expect(summary.contributors).toEqual([]);
  });

  it('gives a single contributor one entry', () => {
    const summary = buildContributionSummary([runAt(0, 'completed', 'ana')], now, 7, 5);
    expect(summary.contributors).toEqual([{id: 'id-ana', name: 'ana', runs: 1}]);
    expect(summary.contributorCount).toBe(1);
  });

  it('builds the same summary from the counts of the server', () => {
    const aggregate: ContributionAggregate = {
      period_days: 7,
      total: 4,
      completed: 1,
      failed: 1,
      running: 2,
      days: [{date: localDayKey(now), runs: 3}, {date: localDayKey(new Date(2026, 9, 26)), runs: 1}],
      contributors: [{id: 'a', name: 'ana', runs: 3}, {id: 'b', name: '', runs: 1}],
      contributor_count: 2
    };
    const summary = buildContributionSummaryFromAggregate(aggregate, now, 7, 1);
    expect(summary.total).toBe(4);
    expect(summary.completed).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.running).toBe(2);
    expect(summary.days.length).toBe(7);
    expect(summary.days[6].runs).toBe(3);
    expect(summary.days[6].level).toBe(4);
    expect(summary.days[4].runs).toBe(1);
    expect(summary.days[4].level).toBe(2);
    expect(summary.days[0].level).toBe(0);
    expect(summary.contributors).toEqual([{id: 'a', name: 'ana', runs: 3}]);
    expect(summary.contributorCount).toBe(2);
  });

  it('names a contributor without a name as an unknown user', () => {
    const aggregate: ContributionAggregate = {
      period_days: 7, total: 1, completed: 1, failed: 0, running: 0, days: [],
      contributors: [{id: 'x', name: '', runs: 1}], contributor_count: 1
    };
    expect(buildContributionSummaryFromAggregate(aggregate, now, 7, 5).contributors[0].name).toBe('Unknown user');
  });
});
