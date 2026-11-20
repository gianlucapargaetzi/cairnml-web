import {TestBed} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {Action, createAction} from '@ngrx/store';
import {Subject} from 'rxjs';
import {UserPreferences} from '@common/user-preferences';
import {UserPrefSaveEffects} from './user-pref-save.effects';
import {UserPrefSyncRegistry} from './user-pref-sync';

const PREFIX = '[user-pref-save spec] ';
const change = createAction(PREFIX + 'change');
const otherAction = createAction('[something else] change');
const initialFeature = {orderBy: 'date', sortOrder: 'asc', other: 1};

describe('UserPrefSaveEffects', () => {
  let actions$: Subject<Action>;
  let store: MockStore;
  let registry: UserPrefSyncRegistry;
  let userPreferences: jasmine.SpyObj<UserPreferences>;
  let subscription: {unsubscribe: () => void};

  const DEBOUNCE = 2000;
  const tick = (ms: number) => jasmine.clock().tick(ms);

  // The state changes first, then the action that caused it is seen by the effects (as in the store).
  const dispatchChange = (state: object, action: Action = change(), extra: object = {}) => {
    store.setState(state);
    actions$.next({...action, ...extra});
  };

  const start = () => {
    subscription = TestBed.inject(UserPrefSaveEffects).save$.subscribe();
  };

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(); // debounceTime reads Date.now()
    actions$ = new Subject<Action>();
    userPreferences = jasmine.createSpyObj<UserPreferences>('UserPreferences', ['setPreferences']);
    TestBed.configureTestingModule({
      providers: [
        UserPrefSaveEffects,
        provideMockActions(() => actions$),
        provideMockStore({initialState: {specFeature: initialFeature}}),
        {provide: UserPreferences, useValue: userPreferences},
      ]
    });
    store = TestBed.inject(MockStore);
    registry = TestBed.inject(UserPrefSyncRegistry);
  });

  afterEach(() => {
    subscription?.unsubscribe();
    jasmine.clock().uninstall();
  });

  describe('a feature state', () => {
    beforeEach(() => {
      registry.register({key: 'specFeature', syncedKeys: ['orderBy', 'sortOrder'], actionsPrefix: [PREFIX]});
    });

    it('saves only the synced keys after 2000 ms without a further change', () => {
      start();

      dispatchChange({specFeature: {orderBy: 'name', sortOrder: 'asc', other: 2}});

      tick(DEBOUNCE - 1);
      expect(userPreferences.setPreferences).not.toHaveBeenCalled();
      tick(1);
      expect(userPreferences.setPreferences).toHaveBeenCalledOnceWith('specFeature', {orderBy: 'name', sortOrder: 'asc'});
    });

    it('a second change within 2000 ms restarts the wait and saves once, with the last value', () => {
      start();

      dispatchChange({specFeature: {orderBy: 'name', sortOrder: 'asc', other: 2}});
      tick(1500);
      dispatchChange({specFeature: {orderBy: 'name', sortOrder: 'desc', other: 2}});

      tick(1999);
      expect(userPreferences.setPreferences).not.toHaveBeenCalled();
      tick(1);
      expect(userPreferences.setPreferences).toHaveBeenCalledOnceWith('specFeature', {orderBy: 'name', sortOrder: 'desc'});
    });

    it('a change after the save is saved again', () => {
      start();

      dispatchChange({specFeature: {orderBy: 'name', sortOrder: 'asc', other: 2}});
      tick(DEBOUNCE);
      dispatchChange({specFeature: {orderBy: 'date', sortOrder: 'asc', other: 2}});
      tick(DEBOUNCE);

      expect(userPreferences.setPreferences.calls.allArgs()).toEqual([
        ['specFeature', {orderBy: 'name', sortOrder: 'asc'}],
        ['specFeature', {orderBy: 'date', sortOrder: 'asc'}],
      ]);
    });

    it('saves nothing for an action of another prefix', () => {
      start();

      dispatchChange({specFeature: {orderBy: 'name', sortOrder: 'asc', other: 2}}, otherAction());

      tick(DEBOUNCE * 2);
      expect(userPreferences.setPreferences).not.toHaveBeenCalled();
    });

    it('saves nothing for an action flagged noPreferences', () => {
      start();

      dispatchChange({specFeature: {orderBy: 'name', sortOrder: 'asc', other: 2}}, change(), {noPreferences: true});

      tick(DEBOUNCE * 2);
      expect(userPreferences.setPreferences).not.toHaveBeenCalled();
    });

    it('saves nothing when the action left the state unchanged', () => {
      start();

      actions$.next(change());

      tick(DEBOUNCE * 2);
      expect(userPreferences.setPreferences).not.toHaveBeenCalled();
    });

    it('a feature registered later is saved too', () => {
      start();
      registry.register({key: 'lateFeature', syncedKeys: ['a'], actionsPrefix: [PREFIX]});

      dispatchChange({specFeature: initialFeature, lateFeature: {a: 1, b: 2}});

      tick(DEBOUNCE);
      expect(userPreferences.setPreferences).toHaveBeenCalledOnceWith('lateFeature', {a: 1});
    });

    it('registering the same key twice saves once', () => {
      registry.register({key: 'specFeature', syncedKeys: ['orderBy', 'sortOrder'], actionsPrefix: [PREFIX]});
      start();

      dispatchChange({specFeature: {orderBy: 'name', sortOrder: 'asc', other: 2}});

      tick(DEBOUNCE);
      expect(userPreferences.setPreferences).toHaveBeenCalledTimes(1);
    });
  });

  describe('a feature without synced keys', () => {
    it('saves nothing', () => {
      registry.register({key: 'specFeature', syncedKeys: [], actionsPrefix: [PREFIX]});
      start();

      dispatchChange({specFeature: {orderBy: 'name', sortOrder: 'asc', other: 2}});

      tick(DEBOUNCE * 2);
      expect(userPreferences.setPreferences).not.toHaveBeenCalled();
    });
  });

  describe('a root state key that waits for the preferences', () => {
    beforeEach(() => {
      registry.register({key: 'specRoot', syncedKeys: ['theme'], actionsPrefix: [PREFIX], waitForPreferencesReady: true});
    });

    it('saves nothing before preferencesReady is set', () => {
      start();

      dispatchChange({specRoot: {theme: 'dark', preferencesReady: false}});

      tick(DEBOUNCE * 2);
      expect(userPreferences.setPreferences).not.toHaveBeenCalled();
    });

    it('saves the synced keys after preferencesReady is set', () => {
      start();

      dispatchChange({specRoot: {theme: 'dark', preferencesReady: true}});

      tick(DEBOUNCE);
      expect(userPreferences.setPreferences).toHaveBeenCalledOnceWith('specRoot', {theme: 'dark'});
    });
  });
});
