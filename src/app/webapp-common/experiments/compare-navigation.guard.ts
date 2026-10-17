import {CanActivateFn, createUrlTreeFromSnapshot} from '@angular/router';
import {inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {combineLatest} from 'rxjs';
import {map, take} from 'rxjs/operators';
import {selectFolderScopeIds, selectTableCompareUrlParts} from '@common/experiments/reducers';

export const compareNavigationGuard: CanActivateFn = (route) => {
  const store = inject(Store);
  return combineLatest([
    store.select(selectTableCompareUrlParts),
    store.select(selectFolderScopeIds),
  ]).pipe(
    take(1),
    map(([{view, selected, experiments, routeConfig}, folderIds]) => {
      const candidates = selected.length > 0 || routeConfig.includes('compare') ? selected : experiments;
      // inside a task folder, only that folder's experiments are compared, even when the last comparison held others
      const ids = folderIds ? (candidates.filter(id => folderIds.includes(id)).length ? candidates.filter(id => folderIds.includes(id)) : folderIds) : candidates;
      return createUrlTreeFromSnapshot(route, [view, {ids}], route?.queryParams);
    })
  );
};
