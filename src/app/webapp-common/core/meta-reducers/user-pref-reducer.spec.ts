import {ActionReducer, createAction} from '@ngrx/store';
import {UserPreferences} from '@common/user-preferences';
import {createUserPrefFeatureReducer, createUserPrefReducer} from './user-pref-reducer';

const PREFIX = '[user-pref-reducer spec] ';
const change = createAction(PREFIX + 'change');

describe('user preferences meta-reducers', () => {
  let userPreferences: jasmine.SpyObj<UserPreferences>;
  let setTimeoutSpy: jasmine.Spy;
  const inner: ActionReducer<Record<string, unknown>> = (state, action) =>
    action.type === change.type ? {...state, orderBy: 'name', preferencesReady: true} : state;

  beforeEach(() => {
    userPreferences = jasmine.createSpyObj<UserPreferences>('UserPreferences', ['isReady', 'getPreferences', 'setPreferences']);
    userPreferences.isReady.and.returnValue(false);
    setTimeoutSpy = spyOn(window, 'setTimeout').and.callThrough();
  });

  it('createUserPrefFeatureReducer is pure: a state change starts no timer and saves nothing', () => {
    const reducer = createUserPrefFeatureReducer('specFeature', userPreferences, inner);

    const next = reducer({orderBy: 'date'}, change());

    expect(next.orderBy).toBe('name');
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    expect(userPreferences.setPreferences).not.toHaveBeenCalled();
  });

  it('createUserPrefReducer is pure: a state change starts no timer and saves nothing', () => {
    const reducer = createUserPrefReducer('specRoot', userPreferences, (state, action) =>
      action.type === change.type ? {...state, specRoot: {orderBy: 'name', preferencesReady: true}} : state);

    const next = reducer({specRoot: {orderBy: 'date', preferencesReady: true}}, change());

    expect(next.specRoot.orderBy).toBe('name');
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    expect(userPreferences.setPreferences).not.toHaveBeenCalled();
  });
});
