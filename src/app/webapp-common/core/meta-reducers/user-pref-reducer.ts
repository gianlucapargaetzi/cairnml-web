import {ActionReducer, Action} from '@ngrx/store';
import {merge} from 'lodash-es';
import {setPreferences} from '../actions/users.actions';
import {UserPreferences} from '@common/user-preferences';
import {NoPreferencesAction} from '@common/core/effects/user-pref-sync';

type ExtAction = Action & NoPreferencesAction;

const firstRun = {};

// These meta-reducers only restore the saved preferences into the state. The state is saved by UserPrefSaveEffects,
// for the keys registered with provideUserPrefSync.

export const createUserPrefReducer = (
  key: string,
  userPreferences: UserPreferences,
  reducer: ActionReducer<any>
): ActionReducer<any, ExtAction> => {

  if (firstRun[key] === undefined) {
    firstRun[key] = true;
  }

  return (state, action): any => {
    let nextState = reducer(state, action);

    if (firstRun[key] && userPreferences.isReady() && nextState[key]) {
      firstRun[key]         = false;
      let savedState = userPreferences.getPreferences(key);
      savedState = Object.entries(savedState || {}).reduce(( acc, [param, val]) => {
        if (val!== undefined && !nextState[param]) {
          acc[param] = val;
        }
        return acc;
      }, {});
      return merge({}, nextState, {[key]: {...savedState, preferencesReady: true}});
    }
    if (action.type === setPreferences.type) {
      const savedState = (action as ReturnType<typeof setPreferences>).payload[key];
      nextState = merge({}, nextState, savedState);
    }
    return nextState;
  };
};

export const createUserPrefFeatureReducer = (
  key: string,
  userPreferences: UserPreferences,
  reducer: ActionReducer<any>,
): ActionReducer<any, ExtAction> => {

  if (firstRun[key] === undefined) {
    firstRun[key] = true;
  }

  return (state, action): any => {
    let nextState = reducer(state, action);

    if (firstRun[key] && userPreferences.isReady() && nextState) {
      firstRun[key]         = false;
      const savedState = userPreferences.getPreferences(key);
      return merge({}, nextState, savedState);
    }
    if (action.type === setPreferences.type) {
      const savedState = (action as ReturnType<typeof setPreferences>).payload[key];
      nextState = merge({}, nextState, savedState);
    }
    return nextState;
  };
};
