import {AccessDataset} from './dataset-access.service';
import {
  canCheckRow,
  canRefreshRow,
  canRemoveRow,
  datasetListRows,
  DatasetGroup,
  DatasetRow,
  RegistryEntry,
  RegistryRecord,
  SignedInUser,
} from './dataset-git.model';

const REGISTRY: RegistryRecord = {
  id: 'reg-1',
  repository: 'acme/registry',
  url: 'https://github.com/acme/registry',
  added: '2026-11-01',
  added_by: 'alice',
};

function entry(name: string, registry = 'acme/registry'): RegistryEntry {
  return {name, source: 'web', link: `https://example.org/${name}`, registry};
}

function access(partial: Partial<AccessDataset>): AccessDataset {
  return {
    id: 'ds-1', kind: 'repo', ref: '', name: '', owner: 'alice', visibility: 'user', projects: [],
    project_shares: [], credential: null, state: 'ok', state_message: '', source: '', link: '',
    added: null, last_checked: null, ...partial,
  };
}

function group(partial: Partial<DatasetGroup>): DatasetGroup {
  return {key: 'k', name: 'n', repo: '', kind: 'registry', versions: [], runCount: 0, datasetId: null, ...partial};
}

describe('datasetListRows', () => {
  it('lists each registry as a parent row with its datasets as children, sorted by name', () => {
    const rows = datasetListRows({
      groups: [],
      entries: [entry('zeta'), entry('alpha')],
      registries: [REGISTRY],
      visible: [],
    });

    expect(rows.map(r => [r.name, r.kind, r.parentId])).toEqual([
      ['acme/registry', 'registry-group', null],
      ['alpha', 'registry', 'registry-group|acme/registry'],
      ['zeta', 'registry', 'registry-group|acme/registry'],
    ]);
    expect(rows[0].entries).toBe(2);
  });

  it('lists an older registry without an id as a parent row', () => {
    const older: RegistryRecord = {...REGISTRY, id: null, repository: 'acme/old-registry'};
    const rows = datasetListRows({groups: [], entries: [entry('a', 'acme/old-registry')], registries: [older], visible: []});
    expect(rows[0].registry!.id).toBeNull();
    expect(rows[1].parentId).toBe(rows[0].id);
  });

  it('keeps a registry with no datasets as a parent row with a count of zero', () => {
    const rows = datasetListRows({groups: [], entries: [], registries: [REGISTRY], visible: []});
    expect(rows.length).toBe(1);
    expect(rows[0].kind).toBe('registry-group');
    expect(rows[0].entries).toBe(0);
  });

  it('keeps repository datasets flat at the top level', () => {
    const own = group({key: 'own|git@x:acme/cars.git', name: 'cars', repo: 'git@x:acme/cars.git', kind: 'own'});
    const rows = datasetListRows({groups: [own], entries: [], registries: [REGISTRY], visible: []});
    const ownRow = rows.find(r => r.id === own.key) as DatasetRow;
    expect(ownRow.parentId).toBeNull();
    expect(ownRow.kind).toBe('own');
  });

  it('lists a registry dataset that a run used under its registry', () => {
    const used = group({key: 'registry|x|alpha', name: 'alpha', repo: 'https://example.org/x', kind: 'registry'});
    const rows = datasetListRows({
      groups: [used],
      entries: [entry('alpha')],
      registries: [REGISTRY],
      visible: [],
    });
    expect(rows.map(r => [r.name, r.parentId])).toEqual([
      ['acme/registry', null],
      ['alpha', 'registry-group|acme/registry'],
    ]);
  });

  it('keeps a registry entry flat when its registry is not listed', () => {
    const rows = datasetListRows({
      groups: [],
      entries: [entry('orphan', 'acme/unknown')],
      registries: [REGISTRY],
      visible: [],
    });
    const orphan = rows.find(r => r.name === 'orphan') as DatasetRow;
    expect(orphan.parentId).toBeNull();
  });

  it('takes the access record of a registry and of a repository from the visible datasets', () => {
    const own = group({key: 'own|https://github.com/acme/cars', name: 'cars', repo: 'https://github.com/acme/cars', kind: 'own'});
    const rows = datasetListRows({
      groups: [own],
      entries: [],
      registries: [REGISTRY],
      visible: [
        access({id: 'reg-ds', kind: 'registry', ref: 'acme/registry', owner: 'alice'}),
        access({id: 'repo-ds', kind: 'repo', ref: 'https://github.com/acme/cars.git', owner: 'carol'}),
      ],
    });
    expect(rows.find(r => r.kind === 'registry-group')!.access!.id).toBe('reg-ds');
    expect(rows.find(r => r.kind === 'own')!.access!.id).toBe('repo-ds');
  });
});

describe('canRemoveRow', () => {
  const alice: SignedInUser = {id: 'alice', admin: false};
  const bob: SignedInUser = {id: 'bob', admin: false};
  const admin: SignedInUser = {id: 'root', admin: true};

  function repoRow(owner: string | undefined, visible = true): DatasetRow {
    return {
      id: 'own|cars', name: 'cars', kind: 'own', repository: 'https://github.com/acme/cars', registryName: null,
      commit: null, versions: 1, runs: 1, parentId: null, registry: null, entries: 0,
      access: visible ? access({id: 'repo-ds', kind: 'repo', owner: owner as string}) : null,
    };
  }

  function registryRow(owner: string | undefined, registryId: string | null = 'reg-1'): DatasetRow {
    return {
      id: 'registry-group|acme/registry', name: 'acme/registry', kind: 'registry-group', repository: 'acme/registry',
      registryName: null, commit: null, versions: 0, runs: 0, parentId: null,
      registry: {...REGISTRY, id: registryId}, entries: 2,
      access: access({id: 'reg-ds', kind: 'registry', owner: owner as string}),
    };
  }

  it('lets the owner remove a repository dataset', () => {
    expect(canRemoveRow(repoRow('alice'), alice)).toBeTrue();
  });

  it('does not let another user remove a repository dataset', () => {
    expect(canRemoveRow(repoRow('alice'), bob)).toBeFalse();
  });

  it('lets an admin remove any repository dataset', () => {
    expect(canRemoveRow(repoRow('alice'), admin)).toBeTrue();
  });

  it('hides remove when the dataset is not visible to the user (its owner is unknown)', () => {
    expect(canRemoveRow(repoRow(undefined, false), alice)).toBeFalse();
    expect(canRemoveRow(repoRow(undefined, false), admin)).toBeFalse();
  });

  it('lets the owner of a registry remove it, and not another user', () => {
    expect(canRemoveRow(registryRow('alice'), alice)).toBeTrue();
    expect(canRemoveRow(registryRow('alice'), bob)).toBeFalse();
  });

  it('does not offer remove for a registry without a dataset id', () => {
    expect(canRemoveRow(registryRow('alice', null), alice)).toBeFalse();
    expect(canRemoveRow(registryRow('alice', null), admin)).toBeFalse();
  });
});

describe('canRefreshRow', () => {
  const alice: SignedInUser = {id: 'alice', admin: false};
  const bob: SignedInUser = {id: 'bob', admin: false};

  function registryRow(owner: string | undefined, registryId: string | null = 'reg-1'): DatasetRow {
    return {
      id: 'registry-group|x', name: 'x', kind: 'registry-group', repository: 'x', registryName: null, commit: null,
      versions: 0, runs: 0, parentId: null, registry: {...REGISTRY, id: registryId}, entries: 0,
      access: owner === undefined ? null : access({owner}),
    };
  }

  it('shows refresh to the owner and to an admin', () => {
    expect(canRefreshRow(registryRow('alice'), alice)).toBeTrue();
    expect(canRefreshRow(registryRow('alice'), {id: 'root', admin: true})).toBeTrue();
  });

  it('hides refresh from another user when the owner is known', () => {
    expect(canRefreshRow(registryRow('alice'), bob)).toBeFalse();
  });

  it('leaves the owner check to the server when the owner is not known', () => {
    expect(canRefreshRow(registryRow(undefined), bob)).toBeTrue();
  });

  it('hides refresh for an older registry without an id', () => {
    expect(canRefreshRow(registryRow('alice', null), alice)).toBeFalse();
  });

  it('never offers refresh on a repository dataset', () => {
    const repo: DatasetRow = {...registryRow('alice'), kind: 'own'};
    expect(canRefreshRow(repo, alice)).toBeFalse();
  });
});

describe('canCheckRow', () => {
  function row(kind: DatasetRow['kind'], accessRow: AccessDataset | null): DatasetRow {
    return {
      id: 'own|cars', name: 'cars', kind, repository: 'https://github.com/acme/cars', registryName: null,
      commit: null, versions: 1, runs: 1, parentId: null, registry: null, entries: 0, access: accessRow,
    };
  }

  it('shows Check now for a repository dataset that has a record', () => {
    expect(canCheckRow(row('own', access({id: 'repo-ds', kind: 'repo', owner: 'alice'})))).toBeTrue();
  });

  it('hides it for a dataset with no record (listed from a run or from the company App only)', () => {
    expect(canCheckRow(row('own', null))).toBeFalse();
  });

  it('hides it for a registry, which has its own refresh', () => {
    expect(canCheckRow(row('registry-group', access({id: 'reg', kind: 'registry', owner: 'alice'})))).toBeFalse();
  });
});
