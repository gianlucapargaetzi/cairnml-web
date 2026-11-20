import {inject, Injectable} from '@angular/core';
import {Actions, createEffect} from '@ngrx/effects';
import {Store} from '@ngrx/store';
import {concatLatestFrom} from '@ngrx/operators';
import {pick} from 'lodash-es';
import {debounceTime, filter, map, mergeMap, scan, switchMap, take, tap} from 'rxjs/operators';
import {EMPTY, Observable} from 'rxjs';
import {UserPreferences} from '@common/user-preferences';
import {NoPreferencesAction, USER_PREF_SAVE_DEBOUNCE, UserPrefSync, UserPrefSyncRegistry} from './user-pref-sync';

/**
 * Saves the registered parts of the store to the user preferences: after an action of the registered prefix changed the
 * state, the synced values are saved once no further change came within the debounce time.
 */
@Injectable()
export class UserPrefSaveEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private userPreferences = inject(UserPreferences);
  private registry = inject(UserPrefSyncRegistry);

  save$ = createEffect(() => this.registry.syncs$.pipe(
    mergeMap(sync => this.saveAfterChanges(sync))
  ), {dispatch: false});

  private saveAfterChanges(sync: UserPrefSync): Observable<unknown> {
    if (sync.syncedKeys.length === 0) {
      return EMPTY; // nothing to save
    }
    const slice$ = this.store.select(state => state?.[sync.key]);
    return slice$.pipe(
      take(1),
      switchMap(initialSlice => this.actions$.pipe(
        concatLatestFrom(() => slice$),
        scan((previous, [action, slice]) => ({action: action as NoPreferencesAction & {type: string}, slice, changed: slice !== previous.slice}),
          {action: null as NoPreferencesAction & {type: string}, slice: initialSlice, changed: false}),
        filter(({action, slice, changed}) =>
          changed &&
          !action.noPreferences &&
          sync.actionsPrefix.some(prefix => action.type.startsWith(prefix)) &&
          (!sync.waitForPreferencesReady || !!slice?.preferencesReady)),
        map(({slice}) => pick(slice, sync.syncedKeys)),
        debounceTime(sync.debounce ?? USER_PREF_SAVE_DEBOUNCE),
        tap(value => this.userPreferences.setPreferences(sync.key, value))
      ))
    );
  }
}
