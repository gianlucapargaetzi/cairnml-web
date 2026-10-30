import {inject, Injectable, signal} from '@angular/core';
import {UserPreferences} from '@common/user-preferences';
import {OverviewSettings, resolveOverviewSettings} from '@common/project-info/overview-panels';

const OVERVIEW_PREFERENCES_KEY = 'overview';

/**
 * The overview layout of the signed-in user, per project, kept in the user preferences like the other view settings.
 * Changes are visible at once to every component that reads `settings`.
 */
@Injectable({providedIn: 'root'})
export class OverviewSettingsService {
  private userPreferences = inject(UserPreferences);
  private changed = signal<Record<string, OverviewSettings>>({});

  settings(projectId: string): OverviewSettings {
    const changed = this.changed()[projectId];
    if (changed) {
      return changed;
    }
    const saved = this.userPreferences.isReady() ? this.userPreferences.getPreferences(OVERVIEW_PREFERENCES_KEY)?.[projectId] : null;
    return resolveOverviewSettings(saved);
  }

  save(projectId: string, settings: OverviewSettings) {
    const resolved = resolveOverviewSettings(settings);
    this.changed.update(state => ({...state, [projectId]: resolved}));
    this.userPreferences.setPreferences([OVERVIEW_PREFERENCES_KEY, projectId], resolved);
  }
}
