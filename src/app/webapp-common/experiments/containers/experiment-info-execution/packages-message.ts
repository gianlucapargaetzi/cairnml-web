/**
 * What the Python packages section says when the task has no packages text to show: an empty text means none are
 * installed; a missing text means they come from the repository's requirements file, which only a task with a repository has.
 */
export function packagesMessage(pip: string | null | undefined, hasRepository: boolean): string {
  if (pip === '') {
    return 'No packages will be installed';
  }
  return hasRepository ? 'Packages will be installed from repository requirements.txt' : 'No packages recorded for this task';
}
