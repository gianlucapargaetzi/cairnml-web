import {Repo, RepoRun} from '../../datasets/dataset-git/repositories.service';
import {repositoryRows} from './repository-rows';

const repo = (id: string, name: string, roles: string[], credential = ''): Repo => ({
  id, name, url: `https://git/${name}`, roles, can_assign: true,
  access: {state: credential ? 'assigned' : 'unknown', message: '', warning: false, readable: null},
  assignments: credential ? [{mine: true, credential_name: credential}] : [],
} as unknown as Repo);

describe('repositoryRows', () => {
  it('sorts by name, labels the roles, counts only this project\'s runs', () => {
    const runs: Record<string, RepoRun[]> = {b: [{project: 'p'}, {project: 'p'}, {project: 'other'}] as RepoRun[]};
    const rows = repositoryRows([repo('b', 'beta', ['code', 'dataset'], 'my token'), repo('a', 'alpha', ['dataset'])], runs, 'p');
    expect(rows.map(row => row.name)).toEqual(['alpha', 'beta']);
    expect(rows[1].roles).toBe('Code, Dataset');
    expect(rows[1].runs).toBe(2);
    expect(rows[0].runs).toBe(0);
  });
});
