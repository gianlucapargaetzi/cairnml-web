import {ActionCreator, createSelector, on, ReducerTypes, select, Store} from '@ngrx/store';
import {filter, map, takeWhile, timeout} from 'rxjs/operators';
import {
  addCredential,
  removeCredential, removeSignedUrl, resetCredential, resetCredentials,
  setCredentialLabel, setSignedUrl, setSignedUrls,
  showLocalFilePopUp,
  updateAllCredentials
} from '../actions/common-auth.actions';
import {CredentialKey} from '~/business-logic/model/auth/credentialKey';

export interface Credentials {
  Bucket?: string;
  Endpoint?: string;
  Key?: string;
  Secret?: string;
  Token?: string;
  Region?: string;
}

export interface CredentialKeyExt extends CredentialKey {
  secret_key?: string;
  company?: string;
  access_key?: string;
}

export interface AuthState {
  showLocalFilePopup: boolean;
  localFilesPopupURLs: string[];
  revokeSucceed: boolean;
  credentials: Record<string, CredentialKeyExt[]>;
  maxCredentials: number;
  newCredential: CredentialKeyExt;
  signedUrls: Record<string, { signed: string; expires: number }>;
}

export const initAuth: AuthState = {
  showLocalFilePopup: false,
  localFilesPopupURLs: [],
  revokeSucceed: false,
  credentials: {},
  maxCredentials: null,
  newCredential: null,
  signedUrls: {},
};

export const selectAuth = state => state.auth as AuthState;

// Auth selectors
export const selectRevokeSucceed = createSelector(selectAuth, state => state.revokeSucceed);
export const selectCredentials = createSelector(selectAuth, state => state.credentials);
export const selectMaxCredentials = createSelector(selectAuth, state => state.maxCredentials);
export const selectNewCredential = createSelector(selectAuth, state => state.newCredential);
export const selectShowLocalFilesPopUp = createSelector(selectAuth, state => state.showLocalFilePopup);
export const selectSignedUrls = createSelector(selectAuth, state => state.signedUrls);
export const selectSignedUrl = (url: string) => createSelector(selectAuth, state => state.signedUrls[url]);
export const getSignedUrlOrOrigin$ = (url: string, store: Store) => store.pipe(
  select(selectSignedUrl(url)),
  filter(signed => !!signed?.signed),
  map(signed => signed?.signed),
  timeout({
      first: 900,
      with: () => store.select(selectSignedUrl(url))
        .pipe(
          takeWhile(signed => signed !== null),
          map(signed => signed?.signed || url)
        )
    }
  ),
);


export const commonAuthReducer = [
  on(showLocalFilePopUp, (state, action) => ({...state, showLocalFilePopup: true, localFilesPopupURLs: Array.from(new Set([...state.localFilesPopupURLs, action.url]))})),
  on(resetCredential, state => ({...state, newCredential: initAuth.newCredential})),
  on(resetCredentials, state => ({...state, credentials: initAuth.credentials})),
  on(addCredential, (state, action) => ({
    ...state,
    newCredential: {...action.newCredential, company: action.workspaceId},
    credentials: {
      ...state.credentials,
      [action.workspaceId]: [
        ...(state.credentials[action.workspaceId] || []),
        ...(Object.keys(action.newCredential).length > 0 ? [{...action.newCredential, company: action.workspaceId}] : [])
      ]
    }
  })),
  on(setCredentialLabel, (state, action) => ({
    ...state,
    newCredential: {...state.newCredential, label: action.label},
    credentials: {
      ...state.credentials,
      [action.credential.company]: state.credentials[action.credential.company]?.map(cred =>
        cred.access_key === action.credential.access_key ? {...action.credential, label: action.label} : cred)
    }
  })),
  on(removeCredential, (state, action) => ({
    ...state, credentials: {
      ...state.credentials,
      [action.workspaceId]: state.credentials[action.workspaceId].filter((cred => cred.access_key !== action.accessKey))
    }
  })),
  on(updateAllCredentials, (state, action) => ({
    ...state,
    credentials: {[action.credentials[0]?.company || action.workspace]: action.credentials, ...action.extra},
    revokeSucceed: false,
    maxCredentials: action.maxCredentials
  })),
  on(setSignedUrl, (state, action) => ({...state, signedUrls: {...state.signedUrls, [action.url]: {signed: action.signed, expires: action.expires}}})),
  on(setSignedUrls, (state, action) => ({...state, signedUrls: {
      ...state.signedUrls,
      ...action.signed.reduce((acc, res) => {
        acc[res.url] = {signed: res.signed, expires: res.expires};
        return acc;
      }, {})
    }})),
  on(removeSignedUrl, (state, action) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {[action.url]: remove, ...rest} = state.signedUrls;
    return {...state, signedUrls: rest};
  }),
] as ReducerTypes<AuthState, ActionCreator[]>[];
