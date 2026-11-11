/**
 * The two title lines of the application header:
 *   line 1  what we are looking at: the project, task, model or report name, or the name of the page
 *   line 2  where it is, from the root: "Projects / ui-audit / Task list"
 * Pure function of the route, so every page gets a header whether or not it registered one (`sm-page-header`).
 */
export interface HeaderPart {
  name: string;
  /** router link of this part, when it is a place of its own */
  link?: string[];
}

export interface HeaderTitles {
  title: string;
  trail: HeaderPart[];
}

export interface HeaderTitleContext {
  /** current url, with query and fragment */
  url: string;
  /** title the page registered with `sm-page-header`, if any */
  pageTitle: string | null;
  /** names of the breadcrumbs of the page, from the root */
  crumbs: string[];
  /** name of the selected project (the full path of a nested project), if any */
  projectName: string | null;
  /** name of the task (experiment) with this id */
  experimentName: (id: string) => string;
  /** label of the active tab of the header, if the page has tabs */
  tab: string | null;
  /** the active workspace, shown when the page has nothing above it */
  workspace: string | null;
}

/** The side navigation entry a page belongs to; the root of line 2. */
const SECTIONS: Record<string, string> = {
  dashboard: 'Projects',
  projects: 'Projects',
  reports: 'Projects',
  pipelines: 'Pipelines',
  datasets: 'Repositories & Datasets',
  'workers-and-queues': 'Agents & Queues',
  endpoints: 'Endpoints',
  settings: 'Settings',
};

const PROJECTS: HeaderPart = {name: 'Projects', link: ['/projects']};

const dedupe = (parts: HeaderPart[], title: string): HeaderPart[] => {
  const seen = new Set<string>([title]);
  return parts.filter(part => part.name && !seen.has(part.name) && !!seen.add(part.name));
};

/** "ui-audit/nested" -> the parents of the project (their ids are not known here, so no links) and the name of the project itself. */
const projectParts = (projectName: string): {parents: HeaderPart[]; name: string} => {
  const names = projectName.split('/').filter(Boolean);
  return {parents: names.slice(0, -1).map(name => ({name})), name: names.at(-1) ?? projectName};
};

export const deriveHeaderTitles = (ctx: HeaderTitleContext): HeaderTitles => {
  const [path] = (ctx.url ?? '').split(/[?#]/);
  const [root, second, third, fourth] = path.split('/').filter(Boolean);
  const section = SECTIONS[root] ?? null;
  const tab = ctx.tab ? {name: ctx.tab} : null;

  // Projects: the project is what we look at, a task or a folder inside it is more specific
  if (root === 'projects' && second) {
    const all = second === '*';
    const {parents, name} = all ? {parents: [] as HeaderPart[], name: 'All tasks'} : projectParts(ctx.projectName || second);
    const projectPart: HeaderPart = {name, link: all ? undefined : ['/projects', second, 'overview']};
    const isTask = (third === 'tasks' || third === 'folders') && !!fourth && fourth !== 'compare';
    if (isTask) {
      const title = third === 'tasks' ? ctx.experimentName(fourth) : decodeURIComponent(fourth);
      return {title, trail: dedupe([PROJECTS, ...parents, projectPart, ...(tab ? [tab] : [])], title)};
    }
    if (third?.startsWith('compare-')) {
      return {title: 'Compare tasks', trail: dedupe([PROJECTS, ...parents, projectPart, ...(tab ? [tab] : [])], 'Compare tasks')};
    }
    return {title: name, trail: dedupe([PROJECTS, ...parents, ...(tab ? [tab] : [])], name)};
  }

  // A report belongs to a project: /reports/<project>/<report>
  if (root === 'reports' && second && third && ctx.pageTitle) {
    const project = ctx.projectName ? projectParts(ctx.projectName) : null;
    const projectPart: HeaderPart[] = project ? [...project.parents, {name: project.name, link: ['/projects', second, 'overview']}] : [];
    return {title: ctx.pageTitle, trail: dedupe([PROJECTS, ...projectPart, {name: 'Reports', link: ['/reports']}], ctx.pageTitle)};
  }

  // Everything else: the name of the page, below it the section and the active tab
  const title = ctx.pageTitle ?? ctx.crumbs.at(-1) ?? section ?? '';
  const level = path.split('/').filter(Boolean).length;
  // a feature page that registered its own title: the crumbs only repeat the section, so line 2 is the section and the tab
  const useCrumbs = !(ctx.pageTitle && section && level <= 2);
  const parts: HeaderPart[] = [
    ...(section ? [{name: section, link: root === 'settings' ? undefined : ['/' + root]}] : []),
    ...(useCrumbs ? ctx.crumbs.slice(0, -1).map(name => ({name})) : []),
    ...(tab ? [tab] : []),
  ];
  const trail = dedupe(parts, title);
  return {title, trail: trail.length ? trail : [{name: ctx.workspace || 'CairnML'}]};
};
