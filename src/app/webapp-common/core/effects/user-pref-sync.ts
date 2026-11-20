import {inject, Injectable, makeEnvironmentProviders, provideEnvironmentInitializer} from '@angular/core';
import {Observable, ReplaySubject} from 'rxjs';

/** An action that must not be saved to the user preferences. */
export interface NoPreferencesAction {
  noPreferences?: boolean;
}

/** Which part of the store is saved to the user preferences, and after which actions. */
export interface UserPrefSync {
  /** The state key. It is also the key under which the values are saved. */
  key: string;
  /** The keys of the state that are saved. */
  syncedKeys: string[];
  /** Only actions whose type starts with one of these prefixes cause a save. */
  actionsPrefix: string[];
  /** Root state keys only: do not save before the state holds `preferencesReady`. */
  waitForPreferencesReady?: boolean;
  /** Milliseconds without a further change before the save. */
  debounce?: number;
}

export const USER_PREF_SAVE_DEBOUNCE = 2000;

/** The parts of the store that are saved to the user preferences; features register theirs when their providers start. */
@Injectable({providedIn: 'root'})
export class UserPrefSyncRegistry {
  private readonly keys = new Set<string>();
  private readonly registered = new ReplaySubject<UserPrefSync>();

  readonly syncs$: Observable<UserPrefSync> = this.registered.asObservable();

  register(sync: UserPrefSync) {
    if (this.keys.has(sync.key)) {
      return;
    }
    this.keys.add(sync.key);
    this.registered.next(sync);
  }
}

export const provideUserPrefSync = (...syncs: UserPrefSync[]) =>
  makeEnvironmentProviders([
    provideEnvironmentInitializer(() => {
      const registry = inject(UserPrefSyncRegistry);
      syncs.forEach(sync => registry.register(sync));
    })
  ]);
