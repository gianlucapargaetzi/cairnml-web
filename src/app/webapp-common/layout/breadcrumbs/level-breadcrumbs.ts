import {IBreadcrumbsLink} from './breadcrumbs.component';

/**
 * The fixed title of each level of a project, so the title does not depend on how you got there:
 *   project dashboard  ->  Project Dashboard / <project>
 *   task (folder)      ->  <task>: Dashboard / <project>
 *   experiment         ->  <experiment>: Experiment / <project>
 *   all experiments    ->  All Experiments / <project>
 * Returns null for pages outside these levels, which keep their own breadcrumbs.
 */
export const levelBreadcrumbs = (
  url: string,
  projectName: string,
  experimentName: (experimentId: string) => string,
): IBreadcrumbsLink[][] | null => {
  const [path] = (url ?? '').split(/[?#]/);
  const [root, projectId, section, child] = path.split('/').filter(Boolean);
  if (root !== 'projects' || !projectId || projectId === '*') {
    return null;
  }
  const project = {name: projectName || projectId};

  if (section === 'folders' && !child) {
    return [[{name: 'Project Dashboard'}, project]];
  }
  if (section === 'folders' && child) {
    return [[{name: `${decodeURIComponent(child)}: Dashboard`}, project]];
  }
  if (section === 'tasks' && !child) {
    return [[{name: 'All Experiments'}, project]];
  }
  if (section === 'tasks' && child && child !== 'compare') {
    return [[{name: `${experimentName(child)}: Experiment`}, project]];
  }
  return null;
};
