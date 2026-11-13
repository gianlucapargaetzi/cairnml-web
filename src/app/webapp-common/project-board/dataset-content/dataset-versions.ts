import {DatasetVersion} from '../../datasets/dataset-git/repositories.service';

export interface VersionsView {
  /** Samples per version that has a manifest, oldest first (x is the commit date). */
  points: {x: string; y: number}[];
  /** The newest version's line, e.g. "2,500 samples · train 2,000, test 500"; null when no version has a manifest. */
  caption: string | null;
}

const count = (value: number) => value.toLocaleString('en-US');

/** What the card draws: the samples of each version with a manifest, and the newest such version's samples and splits as a caption. */
export function versionsView(versions: DatasetVersion[]): VersionsView {
  const measured = versions.filter(version => version.samples !== null);
  const points = measured.map(version => ({x: version.date, y: version.samples as number}));
  const latest = measured[measured.length - 1];
  if (!latest) {
    return {points, caption: null};
  }
  const splits = Object.entries(latest.splits ?? {}).map(([name, size]) => `${name} ${count(size)}`);
  return {points, caption: `${count(latest.samples as number)} samples${splits.length ? ' · ' + splits.join(', ') : ''}`};
}

/** The dataset a card shows: the id in its settings, or null. */
export const datasetSetting = (settings: Record<string, unknown>): string | null =>
  typeof settings['dataset'] === 'string' && settings['dataset'] ? settings['dataset'] : null;
