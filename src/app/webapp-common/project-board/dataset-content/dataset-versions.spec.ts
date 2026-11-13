import {DatasetVersion} from '../../datasets/dataset-git/repositories.service';
import {datasetSetting, versionsView} from './dataset-versions';

const v = (date: string, samples: number | null, splits: Record<string, number> = {}): DatasetVersion => ({commit: date, date, message: '', samples, splits});

describe('versionsView', () => {
  it('has no caption when no version has a manifest', () => {
    expect(versionsView([v('2026-01-01', null)])).toEqual({points: [], caption: null});
    expect(versionsView([])).toEqual({points: [], caption: null});
  });

  it('draws the samples of each version and captions the newest with its splits', () => {
    const view = versionsView([v('2026-01-01', 500), v('2026-02-01', null), v('2026-03-01', 2500, {train: 2000, test: 500})]);
    expect(view.points).toEqual([{x: '2026-01-01', y: 500}, {x: '2026-03-01', y: 2500}]);
    expect(view.caption).toBe('2,500 samples · train 2,000, test 500');
  });

  it('leaves the splits out when the manifest names none', () => {
    expect(versionsView([v('2026-01-01', 12)]).caption).toBe('12 samples');
  });
});

describe('datasetSetting', () => {
  it('reads a dataset id and ignores anything else', () => {
    expect(datasetSetting({dataset: 'abc'})).toBe('abc');
    expect(datasetSetting({dataset: 5})).toBeNull();
    expect(datasetSetting({})).toBeNull();
  });
});
