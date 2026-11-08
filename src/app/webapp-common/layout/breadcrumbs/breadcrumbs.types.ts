import {Params, UrlTree} from '@angular/router';

// The breadcrumb data the routes put into the store (`selectBreadcrumbs`); the header derives its title block from it.
export enum CrumbTypeEnum {
  Workspace = 'Workspace',
  Feature = 'Feature',
  Project = 'Project',
  SubFeature = 'SubFeature',
}

export interface IBreadcrumbsLink {
  name?: string;
  url?: string | UrlTree;
  urlParams?: Params;
  queryParamsHandling?: 'merge' | 'preserve' | '';
  linkLast?: boolean;
  subCrumbs?: { name?: string; url: string; hidden?: boolean }[];
  isProject?: boolean;
  type?: CrumbTypeEnum;
  hidden?: boolean;
  collapsable?: boolean;
  example?: boolean;
  id?: string;
  tags?: string[];
  badge?: string;
  badgeWarn?: boolean;
  badgeTooltip?: string;
  onlyWithProject?: boolean;
}

export interface IBreadcrumbsOptions {
  showProjects: boolean;
  featureBreadcrumb: IBreadcrumbsLink;
  subFeatureBreadcrumb?: IBreadcrumbsLink;
  projectsOptions?: {
    basePath: string;
    noSubProjectsRedirectPath?: string;
    filterBaseNameWith: string[];
    compareModule: string;
    showSelectedProject: boolean;
    queryParamsHandling?: 'merge' | 'preserve' | '';
    selectedProjectBreadcrumb: IBreadcrumbsLink;
  };
}
