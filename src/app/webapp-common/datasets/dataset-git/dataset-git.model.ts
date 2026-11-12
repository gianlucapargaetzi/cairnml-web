
// Datasets as the SDK records them on each task: the task parameters in the section "Datasets", named "<alias>/<field>".
// A run that used a dataset carries the repository, the commit and the storage (see cairnml/datasets/_shared.py and
// dataset.py in the SDK). This file turns those parameters into datasets with their versions and runs.

export const DATASETS_SECTION = 'Datasets';

export type DatasetStorage = 'lfs' | 's3';

export interface DatasetRunRef {
  taskId: string;
  taskName: string;
  projectId: string;
  projectName: string;
  status: string;
  lastUpdate: string;
}

export interface DatasetVersion {
  commit: string;
  contentHash: string;
  storage: DatasetStorage | null;
  // Shell commands that fetch this version by hand; null when they cannot be shown safely.
  fetchCommands: string[] | null;
  runs: DatasetRunRef[];
}

export interface DatasetGroup {
  key: string;
  name: string;
  repo: string;
  // the id of the server's dataset the runs used, when the runs recorded it (runs made before ids were recorded have none)
  datasetId: string | null;
  // 'own' is a dataset of the user, read by commit; 'registry' is read by name from the dataset registry.
  kind: 'own' | 'registry';
  versions: DatasetVersion[];
  runCount: number;
}

export interface RawDatasetTask {
  id: string;
  name: string;
  status: string;
  last_update?: string | Date;
  project?: { id: string; name?: string } | string;
  hyperparams?: Record<string, Record<string, { value?: unknown } | unknown>>;
}

const SAFE_REPO = /^(https?|ssh|git):\/\/[^\s'"`$;&|<>\\]+$|^git@[^\s'"`$;&|<>\\]+:[^\s'"`$;&|<>\\]+$/;
const SAFE_COMMIT = /^[A-Za-z0-9._/-]+$/;
const SAFE_FOLDER = /^[A-Za-z0-9._-]+$/;

// The same commands as cairnml.datasets.dataset.fetch_commands in the SDK.
export function fetchCommands(repo: string, commit: string, storage: DatasetStorage | null): string[] | null {
  if (!SAFE_REPO.test(repo) || !SAFE_COMMIT.test(commit)) {
    return null;
  }
  if (storage === 'lfs') {
    const folder = repo.replace(/\/+$/, '').replace(/\.git$/, '').split(/[/:]/).pop();
    if (!folder || !SAFE_FOLDER.test(folder)) {
      return null;
    }
    return [`git clone ${repo} ${folder}`, `git -C ${folder} checkout ${commit}`, `git -C ${folder} lfs pull`];
  }
  if (storage === 's3') {
    return [`cairnml dataset get ${repo} ${commit}`];
  }
  return null;
}

function paramValue(param: unknown): string {
  const value = param && typeof param === 'object' && 'value' in param ? (param as { value?: unknown }).value : param;
  return value === undefined || value === null ? '' : String(value);
}

function projectOf(task: RawDatasetTask): { id: string; name: string } {
  const project = task.project;
  if (typeof project === 'string') {
    return {id: project, name: ''};
  }
  return {id: project?.id ?? '', name: project?.name ?? ''};
}

// Reads the "Datasets" parameters of each task and groups them by dataset and version.
export function groupDatasetRuns(tasks: RawDatasetTask[]): DatasetGroup[] {
  const groups = new Map<string, {
    group: Omit<DatasetGroup, 'versions' | 'runCount'>;
    versions: Map<string, { version: Omit<DatasetVersion, 'fetchCommands'>; runIds: Set<string> }>;
    runIds: Set<string>;
  }>();

  for (const task of tasks) {
    const section = task.hyperparams?.[DATASETS_SECTION];
    if (!section) {
      continue;
    }
    const records = new Map<string, Record<string, string>>();
    for (const [key, param] of Object.entries(section)) {
      const slash = key.lastIndexOf('/');
      if (slash < 0) {
        continue;
      }
      const alias = key.slice(0, slash);
      const record = records.get(alias) ?? {};
      record[key.slice(slash + 1)] = paramValue(param);
      records.set(alias, record);
    }

    const lastUpdate = task.last_update ? new Date(task.last_update).toISOString() : '';
    const project = projectOf(task);
    const run: DatasetRunRef = {
      taskId: task.id, taskName: task.name, projectId: project.id, projectName: project.name,
      status: task.status, lastUpdate,
    };

    for (const [alias, record] of records) {
      let key: string;
      let group: Omit<DatasetGroup, 'versions' | 'runCount'>;
      let commit: string;
      let storage: DatasetStorage | null = null;
      if (record.kind === 'local') {
        const datasetId = record.id || null;
        key = datasetId ? `own|${datasetId}` : `own|${record.repo}`;
        group = {key, name: alias, repo: record.repo ?? '', kind: 'own', datasetId};
        commit = record.commit ?? '';
        storage = record.storage === 'lfs' || record.storage === 's3' ? record.storage : null;
      } else if (record.kind === 'own' || record.kind === 'external') {
        key = `registry|${record.external_repo}|${record.name}`;
        group = {key, name: record.name ?? alias, repo: record.external_repo ?? '', kind: 'registry', datasetId: null};
        commit = record.revision || record.repo_commit || '';
      } else {
        continue;
      }
      const entry = groups.get(key) ?? {group, versions: new Map(), runIds: new Set<string>()};
      groups.set(key, entry);
      const versionKey = commit || '(unknown)';
      const version = entry.versions.get(versionKey) ?? {
        version: {commit, contentHash: record.content_hash ?? '', storage, runs: []},
        runIds: new Set<string>(),
      };
      entry.versions.set(versionKey, version);
      if (!version.runIds.has(task.id)) {
        version.runIds.add(task.id);
        version.version.runs.push(run);
      }
      entry.runIds.add(task.id);
    }
  }

  return [...groups.values()].map(entry => ({
    ...entry.group,
    runCount: entry.runIds.size,
    versions: [...entry.versions.values()]
      .map(({version}) => ({
        ...version,
        runs: [...version.runs].sort((a, b) => b.lastUpdate.localeCompare(a.lastUpdate)),
        fetchCommands: entry.group.kind === 'own' ? fetchCommands(entry.group.repo, version.commit, version.storage) : null,
      }))
      .sort((a, b) => (b.runs[0]?.lastUpdate ?? '').localeCompare(a.runs[0]?.lastUpdate ?? '')),
  })).sort((a, b) => a.name.localeCompare(b.name));
}


export function repoKey(address: string): string {
  return (address ?? '').trim()
    .replace(/^(https?:\/\/github\.com\/|git@github\.com:)/i, '')
    .replace(/\/+$/, '').replace(/\.git$/, '').toLowerCase();
}

// The registry entries that no run has used yet. A dataset of ours is used when a run read its repository; a public
// dataset is used when a run read it by its name.

export function datasetsOfHyperparams(hyperparams: RawDatasetTask['hyperparams']): DatasetGroup[] {
  return groupDatasetRuns([{id: '', name: '', status: '', hyperparams}]);
}

// A row of the Datasets list. A 'registry-group' row is a registry; its entries are the rows with parentId set.
