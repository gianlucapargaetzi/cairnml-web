import type {AccessDataset} from './dataset-access.service';

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

export interface RegistryEntry {
  name: string;
  source: string;
  link: string;
  // the registry's repository ("owner/name") the entry is listed in
  registry: string;
}

// A registry the server reads: a GitHub repository with one file per entry (dataset_registry.get_registries).
export interface RegistryRecord {
  // the dataset's id, when the registry is kept as a dataset (its owner may remove it); absent for an older registry
  id?: string | null;
  repository: string;
  url: string;
  added: string;
  added_by: string;
}

// A repository address compared the way GitHub compares it: case, a trailing slash and a .git suffix do not matter.
export function repoKey(address: string): string {
  return (address ?? '').trim()
    .replace(/^(https?:\/\/github\.com\/|git@github\.com:)/i, '')
    .replace(/\/+$/, '').replace(/\.git$/, '').toLowerCase();
}

// The registry entries that no run has used yet. A dataset of ours is used when a run read its repository; a public
// dataset is used when a run read it by its name.
export function unusedRegistryEntries(groups: DatasetGroup[], entries: RegistryEntry[]): RegistryEntry[] {
  const usedRepos = new Set(groups.filter(g => g.kind === 'own').map(g => repoKey(g.repo)));
  const usedNames = new Set(groups.filter(g => g.kind === 'registry').map(g => g.name));
  return entries.filter(entry => entry.source === 'repo'
    ? !usedRepos.has(repoKey(entry.link))
    : !usedNames.has(entry.name));
}

// The datasets one run used, read from its hyperparameters (the same grouping as the Datasets page).
export function datasetsOfHyperparams(hyperparams: RawDatasetTask['hyperparams']): DatasetGroup[] {
  return groupDatasetRuns([{id: '', name: '', status: '', hyperparams}]);
}

// A row of the Datasets list. A 'registry-group' row is a registry; its entries are the rows with parentId set.
export type DatasetRowKind = 'own' | 'registry' | 'registry-group';

export interface DatasetRow {
  id: string;
  name: string;
  kind: DatasetRowKind;
  repository: string | null;
  registryName: string | null;
  commit: string | null;
  versions: number;
  runs: number;
  // the id of the registry row this row is listed under; null for a row at the top
  parentId: string | null;
  // for a registry-group row: the registry, and the number of its datasets
  registry: RegistryRecord | null;
  entries: number;
  // the datasets.visible record of the repository or registry, when the signed-in user may see it
  access: AccessDataset | null;
}

export interface DatasetListSources {
  groups: DatasetGroup[];
  entries: RegistryEntry[];
  registries: RegistryRecord[];
  visible: AccessDataset[];
}

export interface SignedInUser {
  id: string | null;
  admin: boolean;
}

// The list of the Datasets page as a tree: each registry is a group row whose datasets are its child rows (sorted by
// name); repository datasets, and registry datasets that name no listed registry, are top-level rows.
export function datasetListRows(sources: DatasetListSources): DatasetRow[] {
  const {groups, entries, registries, visible} = sources;
  const registryByKey = new Map(registries.map(registry => [repoKey(registry.repository), registry]));
  const registryOfName = new Map(entries.map(entry => [entry.name, repoKey(entry.registry ?? '')]));
  // a dataset is matched by its id when the runs recorded one, and by its repository otherwise
  const accessOf = (kind: AccessDataset['kind'], repo: string, datasetId: string | null = null): AccessDataset | null =>
    visible.find(dataset => dataset.kind === kind && (datasetId
      ? dataset.id === datasetId
      : [dataset.ref, dataset.link].some(value => repoKey(value) === repoKey(repo)))) ?? null;
  const blank = (row: Partial<DatasetRow> & Pick<DatasetRow, 'id' | 'name' | 'kind'>): DatasetRow => ({
    repository: null, registryName: null, commit: null, versions: 0, runs: 0,
    parentId: null, registry: null, entries: 0, access: null, ...row,
  });

  const topRows: DatasetRow[] = [];
  const childrenOf = new Map<string, DatasetRow[]>();
  const addChild = (key: string, row: DatasetRow) => {
    if (registryByKey.has(key)) {
      childrenOf.set(key, [...(childrenOf.get(key) ?? []), row]);
    } else {
      topRows.push(row);
    }
  };

  for (const group of groups) {
    if (group.kind === 'own') {
      const row = blank({
        id: group.key, name: group.name, kind: 'own', repository: group.repo,
        commit: group.versions[0]?.commit ?? null, versions: group.versions.length, runs: group.runCount,
        access: accessOf('repo', group.repo, group.datasetId),
      });
      // a repository that is also an entry of a registry is listed under that registry
      const entry = entries.find(e => e.source === 'repo' && repoKey(e.link) === repoKey(group.repo));
      if (entry && registryByKey.has(repoKey(entry.registry ?? ''))) {
        addChild(repoKey(entry.registry), row);
      } else {
        topRows.push(row);
      }
    } else {
      const key = registryOfName.get(group.name) ?? repoKey(group.repo);
      addChild(key, blank({
        id: group.key, name: group.name, kind: 'registry', registryName: group.name,
        commit: group.versions[0]?.commit ?? null, versions: group.versions.length, runs: group.runCount,
      }));
    }
  }
  for (const entry of unusedRegistryEntries(groups, entries)) {
    const key = repoKey(entry.registry ?? '');
    addChild(key, blank({
      id: 'registry-entry|' + key + '|' + entry.name, name: entry.name, kind: 'registry', registryName: entry.name,
    }));
  }
  // A repository dataset that no run uses yet is listed too, so one just added shows at once. A repository that is an
  // entry of a registry is listed under it, as above.
  const usedRepos = new Set(groups.filter(g => g.kind === 'own').map(g => repoKey(g.repo)));
  const usedIds = new Set(groups.filter(g => g.kind === 'own' && g.datasetId).map(g => g.datasetId));
  const registryRepos = new Set(entries.filter(e => e.source === 'repo').map(e => repoKey(e.link)));
  for (const dataset of visible) {
    const key = repoKey(dataset.ref);
    if (dataset.kind !== 'repo' || usedIds.has(dataset.id) || usedRepos.has(key) || registryRepos.has(key)) {
      continue;
    }
    topRows.push(blank({
      id: 'own|' + key, name: dataset.name, kind: 'own', repository: dataset.ref, access: dataset,
    }));
  }

  const groupRows = [...registryByKey.entries()]
    .sort(([, a], [, b]) => a.repository.localeCompare(b.repository))
    .flatMap(([key, registry]) => {
      const id = 'registry-group|' + key;
      const children = (childrenOf.get(key) ?? [])
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(child => ({...child, parentId: id}));
      const parent = blank({
        id, name: registry.repository, kind: 'registry-group', repository: registry.repository,
        registry, entries: children.length, access: accessOf('registry', registry.repository),
      });
      return [parent, ...children];
    });
  return [...topRows, ...groupRows];
}

// The id that datasets.delete takes for a row: the registry's dataset id for a registry, the dataset's id otherwise.
export function removableDatasetId(row: DatasetRow): string | null {
  return row.kind === 'registry-group' ? row.registry?.id ?? null : row.access?.id ?? null;
}

// Owner or admin, and only for a dataset the signed-in user can see (its owner is then known).
export function canRemoveRow(row: DatasetRow, user: SignedInUser): boolean {
  if (!removableDatasetId(row) || !row.access) {
    return false;
  }
  return user.admin || (!!row.access.owner && row.access.owner === user.id);
}

// Shown on a registry that has an id. When the owner is not known, the server decides (it refuses a non-owner).
export function canRefreshRow(row: DatasetRow, user: SignedInUser): boolean {
  if (row.kind !== 'registry-group' || !row.registry?.id) {
    return false;
  }
  const owner = row.access?.owner;
  return user.admin || !owner || owner === user.id;
}
