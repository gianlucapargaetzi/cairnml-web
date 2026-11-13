import {Repo, RepoRun, REPO_ROLE_LABELS} from '../../datasets/dataset-git/repositories.service';
import {RepoAccess} from '../../shared/services/repo-access.service';

export interface RepositoryRow {
  id: string;
  name: string;
  /** "Code", "Dataset" … */
  roles: string;
  access: RepoAccess;
  /** Runs of this project that used the repository. */
  runs: number;
}

export const accessOf = (repo: Repo): RepoAccess => ({
  repository: repo.url, url: repo.url, id: repo.id, project: null,
  state: repo.access.state, via: repo.assignments.find(assignment => assignment.mine)?.credential_name ?? '',
  message: repo.access.message, warning: repo.access.warning, can_assign: repo.can_assign, ask: false,
});

/** One row per repository linked to the project, by name; `runs` maps a repository id to its runs. */
export function repositoryRows(repos: Repo[], runs: Record<string, RepoRun[]>, projectId: string): RepositoryRow[] {
  return repos
    .map(repo => ({
      id: repo.id, name: repo.name, roles: repo.roles.map(role => REPO_ROLE_LABELS[role] ?? role).join(', '), access: accessOf(repo),
      runs: (runs[repo.id] ?? []).filter(run => run.project === projectId).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
