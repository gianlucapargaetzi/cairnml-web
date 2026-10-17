import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn} from '@angular/router';
import {Store} from '@ngrx/store';
import {setTableFilters} from '@common/experiments/actions/common-experiments-view.actions';

/**
 * The experiments table's own route (loaded both at `projects/:id/tasks` directly, and at
 * `projects/:id/folders/:folder`) is entered fresh exactly when you switch to it from somewhere
 * else — a sibling tab, or a folder — since the master table stays mounted for everything that
 * happens inside it (selecting a row, switching to details or compare, paging).
 *
 * Reached through `folders/:folder`, the folder guard (`folderScopeGuard`) has already set the
 * filter that scopes the table to that folder; this guard must not touch it.
 *
 * Reached any other way — in particular, pressing the EXPERIMENTS header tab by hand — there is no
 * folder to scope to, so every filter is cleared, giving a clean "all experiments" view each time.
 */
export const experimentsTabFiltersGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const fromFolder = route.pathFromRoot.some(segment => segment.routeConfig?.path === ':folder');
  if (fromFolder) {
    return true;
  }
  const projectId = route.pathFromRoot.map(segment => segment.params['projectId']).find(Boolean);
  inject(Store).dispatch(setTableFilters({filters: [], projectId}));
  return true;
};
