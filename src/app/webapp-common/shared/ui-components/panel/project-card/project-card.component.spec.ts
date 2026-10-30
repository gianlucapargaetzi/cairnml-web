import {ProjectCardComponent} from './project-card.component';

describe('ProjectCardComponent.convertSecToDaysHrsMinsSec', () => {
  // the method does not read component state, so it is called without an instance
  const format = (secs: number) => ProjectCardComponent.prototype.convertSecToDaysHrsMinsSec.call(null, secs);

  it('formats a duration under a day as HH:MM:SS without a day label', () => {
    expect(format(24 * 60 + 1.797)).toBe('00:24:01');
  });

  it('drops the fractional seconds that the stats carry', () => {
    expect(format(3723.7970000000000255)).toBe('01:02:03');
  });

  it('labels one and several days', () => {
    expect(format(86400 + 3600 + 61)).toBe('1 DAY 01:01:01');
    expect(format(3 * 86400 + 59)).toBe('3 DAYS 00:00:59');
  });

  it('shows zero for an empty duration', () => {
    expect(format(0)).toBe('00:00:00');
    expect(format(undefined as unknown as number)).toBe('00:00:00');
  });
});
