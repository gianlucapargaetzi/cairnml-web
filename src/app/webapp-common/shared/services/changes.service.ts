import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Store} from '@ngrx/store';
import {MatDialog} from '@angular/material/dialog';
import {combineLatest, of} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, filter, map} from 'rxjs/operators';
import {selectCurrentUser} from '../../core/reducers/users-reducer';
import {DeviceDetectorService} from 'ngx-device-detector';
import {default as semverGt} from 'semver/functions/gt';
import {ChangesModalData, VersionChangesModalComponent} from '@common/layout/version-changes-modal/version-changes-modal.component';
import {UserPreferences} from '../../user-preferences';

/** One release note as the "What's new" dialog shows it. */
export interface Change {
  version: string;
  content: string;
  context?: string;
  image: string;
  title: string;
  feature?: string;
}

/** The "What's new" bundle the server writes with the web app: the release notes of each component, by version. */
export type WhatsNewBundle = Partial<Record<WhatsNewComponent, Record<string, string>>>;
export type WhatsNewComponent = 'server' | 'web' | 'sdk';

export const WHATS_NEW_COMPONENTS: WhatsNewComponent[] = ['server', 'web', 'sdk'];
const COMPONENT_LABEL: Record<WhatsNewComponent, string> = {server: 'Server', web: 'Web app', sdk: 'SDK'};
/** The top-level preference that holds the last version of each component the user has been shown. */
export const WHATS_NEW_SEEN_KEY = 'whats_new_seen';
const RELEASE_VERSION = /^\d+\.\d+\.\d+$/;

/** The notes of one release as the dialog's HTML: the text is escaped, its lines become breaks. */
export function releaseNotesToHtml(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped.split('\n').filter(line => line.trim()).map(line => `<p>${line.replace(/^\s*[-*]\s*/, '• ')}</p>`).join('');
}

/** The releases of one component, newest first. */
export function releasesNewestFirst(releases: Record<string, string>): string[] {
  return Object.keys(releases).filter(version => RELEASE_VERSION.test(version))
    .sort((a, b) => (semverGt(a, b) ? -1 : semverGt(b, a) ? 1 : 0));
}

/**
 * The notes to show: for each component, the releases newer than the last version the user was shown. A user with no
 * seen state (the first time) is shown the current release of each component only, not the whole history.
 */
export function unseenChanges(bundle: WhatsNewBundle, seen: Partial<Record<WhatsNewComponent, string>> | null): Change[] {
  const changes: Change[] = [];
  for (const component of WHATS_NEW_COMPONENTS) {
    const releases = bundle?.[component] ?? {};
    const newest = releasesNewestFirst(releases);
    const shown = seen ? newest.filter(version => semverGt(version, seen[component] ?? '0.0.0')) : newest.slice(0, 1);
    for (const version of shown) {
      changes.push({
        version,
        title: `${COMPONENT_LABEL[component]} ${version}`,
        content: releaseNotesToHtml(releases[version]),
        image: '',
      });
    }
  }
  return changes;
}

/** The last version of each component in the bundle: what the user has now seen. */
export function latestSeen(bundle: WhatsNewBundle): Partial<Record<WhatsNewComponent, string>> {
  const latest: Partial<Record<WhatsNewComponent, string>> = {};
  for (const component of WHATS_NEW_COMPONENTS) {
    const newest = releasesNewestFirst(bundle?.[component] ?? {});
    if (newest.length) {
      latest[component] = newest[0];
    }
  }
  return latest;
}

@Injectable({
  providedIn: 'root'
})
export class ChangesService {
  private httpClient = inject(HttpClient);
  private store = inject(Store);
  private matDialog = inject(MatDialog);
  private deviceService = inject(DeviceDetectorService);
  private userPreferences = inject(UserPreferences);

  private changesConfig = signal<Change[]>([]);
  private bundle: WhatsNewBundle = {};
  private mobile = this.deviceService.isMobile();
  public hasChanges = computed(() => this.changesConfig()?.length > 0);

  constructor() {
    combineLatest([
      this.store.select(selectCurrentUser),
      this.userPreferences.isReady$
    ])
      .pipe(
        takeUntilDestroyed(),
        debounceTime(1000),
        filter(([user, ready]) => !!user && ready && !this.mobile && this.matDialog.openDialogs.length === 0),
        distinctUntilChanged(([prev], [curr]) => prev?.id === curr?.id))
      .subscribe(() => this.initChangesService());
  }

  /** Reads the bundle and shows the notes the user has not seen yet. */
  initChangesService() {
    this.httpClient.get('whats-new.json')
      .pipe(
        map((bundle: WhatsNewBundle) => bundle ?? {}),
        catchError(() => of({} as WhatsNewBundle)),
      )
      .subscribe(bundle => {
        this.bundle = bundle;
        const seen = this.userPreferences.getPreferences(WHATS_NEW_SEEN_KEY) ?? null;
        this.changesConfig.set(unseenChanges(bundle, seen));
        if (this.changesConfig().length > 0) {
          this.showChangesModal();
        }
      });
  }

  public showChangesModal() {
    const changes = this.changesConfig().length ? this.changesConfig() : unseenChanges(this.bundle, null);
    if (!changes.length) {
      return;
    }
    this.matDialog.open<VersionChangesModalComponent, ChangesModalData, boolean>(VersionChangesModalComponent, {
      data: {
        changes,
        visitedIndex: 0,
        mainTitle: 'What\'s new'
      },
      maxWidth: '540px'
    }).afterClosed()
      .subscribe(() => this.markSeen());
  }

  /** Saves the last version of each component as seen, so the same notes are not shown again. */
  private markSeen() {
    this.userPreferences.setPreferences(WHATS_NEW_SEEN_KEY, {...this.userPreferences.getPreferences(WHATS_NEW_SEEN_KEY), ...latestSeen(this.bundle)});
    this.changesConfig.set([]);
  }
}
