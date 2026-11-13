import {Repo, RepoRun, REPO_ROLE_LABELS} from '../../datasets/dataset-git/repositories.service';

export interface RepositoryRow {
  id: string;
  name: string;
  /** "Code", "Dataset" … */
  roles: string;
  /** Runs of this project that used the repository. */
  runs: number;
}

/** One row per repository linked to the project, by name; `runs` maps a repository id to its runs. */
export function repositoryRows(repos: Repo[], runs: Record<string, RepoRun[]>, projectId: string): RepositoryRow[] {
  return repos
    .map(repo => ({
      id: repo.id, name: repo.name, roles: repo.roles.map(role => REPO_ROLE_LABELS[role] ?? role).join(', '),
      runs: (runs[repo.id] ?? []).filter(run => run.project === projectId).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
