/**
 * Trials under their search. A hyperparameter search (an optimizer task) starts one task per trial and sets itself as the
 * trial's parent. In the Tasks list the trials are shown under their search, as a group that can be collapsed, instead
 * of as independent rows.
 *
 * Only what is loaded is grouped: a trial whose search is not in the loaded rows stays a row of its own, so no task is
 * ever hidden because its search is on a page that is not loaded yet.
 */
export interface GroupableTask {
  id: string;
  type?: string;
  parent?: string | { id?: string };
}

export interface TaskGroupInfo {
  /** 1 for a trial shown under its search. */
  groupLevel?: 0 | 1;
  /** On a search: how many of its trials are loaded. */
  groupChildren?: number;
  /** On a search: whether its trials are shown. */
  groupExpanded?: boolean;
}

export const OPTIMIZER_TYPE = 'optimizer';

const parentIdOf = (task: GroupableTask): string | undefined =>
  typeof task.parent === 'string' ? task.parent : task.parent?.id;

export function groupTrials<T extends GroupableTask>(tasks: T[], collapsed: ReadonlySet<string>): (T & TaskGroupInfo)[] {
  if (!tasks?.length) {
    return tasks as (T & TaskGroupInfo)[];
  }
  const searches = new Set(tasks.filter(task => task.type === OPTIMIZER_TYPE).map(task => task.id));
  const trialsOf = new Map<string, T[]>();
  const placed = new Set<string>();
  tasks.forEach(task => {
    const parentId = parentIdOf(task);
    if (parentId && parentId !== task.id && searches.has(parentId)) {
      trialsOf.set(parentId, [...(trialsOf.get(parentId) ?? []), task]);
      placed.add(task.id);
    }
  });
  if (trialsOf.size === 0) {
    return tasks as (T & TaskGroupInfo)[];
  }
  const rows: (T & TaskGroupInfo)[] = [];
  tasks.forEach(task => {
    if (placed.has(task.id)) {
      return;
    }
    const trials = trialsOf.get(task.id);
    if (!trials) {
      rows.push(task);
      return;
    }
    const expanded = !collapsed.has(task.id);
    rows.push({...task, groupChildren: trials.length, groupExpanded: expanded});
    if (expanded) {
      trials.forEach(trial => rows.push({...trial, groupLevel: 1}));
    }
  });
  return rows;
}
