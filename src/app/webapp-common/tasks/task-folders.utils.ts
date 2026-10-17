/**
 * Groups experiments into task folders for the project dashboard.
 *
 * A task is a procedure (e.g. "train model X"); an experiment is one execution of it. A remote run is a clone
 * whose `parent` is the task it was cloned from, and a local run (Task.init) has no parent, so it is its own root.
 * Each experiment's folder is named after the root of its parent chain. Runs of the same name in one project
 * share a folder. An experiment whose chain cannot be resolved (no name, or a parent outside this list) is
 * unassigned.
 */

export interface FolderCandidate {
  id: string;
  name?: string;
  parent?: string;
}

export interface TaskFolder<T> {
  name: string;
  experiments: T[];
}

export interface TaskFolders<T> {
  folders: TaskFolder<T>[];
  unassigned: T[];
}

const folderNameOf = <T extends FolderCandidate>(task: T, byId: Map<string, T>): string | null => {
  const visited = new Set<string>();
  let current = task;
  while (current.parent) {
    const parent = byId.get(current.parent);
    if (!parent || visited.has(current.id)) {
      return null;
    }
    visited.add(current.id);
    current = parent;
  }
  return current.name?.trim() || null;
};

export const groupTaskFolders = <T extends FolderCandidate>(experiments: T[]): TaskFolders<T> => {
  const byId = new Map(experiments.map(experiment => [experiment.id, experiment] as const));
  const folders = new Map<string, T[]>();
  const unassigned: T[] = [];

  for (const experiment of experiments) {
    const name = folderNameOf(experiment, byId);
    if (name === null) {
      unassigned.push(experiment);
    } else {
      folders.set(name, [...(folders.get(name) ?? []), experiment]);
    }
  }

  return {
    folders: [...folders.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, items]) => ({name, experiments: items})),
    unassigned,
  };
};
