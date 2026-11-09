import {EntityChipComponent} from '@common/shared/ui-components/tags/entity-chip/entity-chip.component';
import {ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatIcon} from '@angular/material/icon';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatRadioButton, MatRadioChange, MatRadioGroup} from '@angular/material/radio';
import {Store} from '@ngrx/store';
import {PrimeTemplate} from 'primeng/api';
import {lastValueFrom} from 'rxjs';
import {HTTP} from '~/app.constants';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {addMessage} from '@common/core/actions/layout.actions';
import {MESSAGES_SEVERITY} from '@common/constants';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {EmptyStateComponent} from '@common/shared/ui-components/feedback/empty-state/empty-state.component';
import {InlineAlertComponent} from '@common/shared/ui-components/feedback/inline-alert/inline-alert.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';

export type ShareResourceType = 'queue' | 'dataset' | 'registry' | 'credential';

// The levels of a share (apiserver database/model/share.py). Each resource type offers only some of them.
export type ShareLevel = 'read' | 'read_write' | 'collaborator';

export const SHARE_LEVEL_LABELS: Record<ShareLevel, string> = {
  read: 'Read',
  read_write: 'Read/Write',
  collaborator: 'Collaborator',
};

// The levels a type has (the table in the access-model design). Registries and credentials have no Read/Write.
export const SHARE_LEVELS_BY_TYPE: Record<ShareResourceType, ShareLevel[]> = {
  queue: ['read', 'read_write', 'collaborator'],
  dataset: ['read', 'read_write', 'collaborator'],
  registry: ['read', 'collaborator'],
  credential: ['read', 'collaborator'],
};

// The scope choices as shown. 'Only me' is the absence of shares; it has no action of its own.
export type ShareScopeChoice = 'only_me' | 'projects' | 'public';

export const SHARE_SCOPE_LABELS: Record<ShareScopeChoice, string> = {
  only_me: 'Only me',
  projects: 'Projects',
  public: 'Public',
};

// A share as the server lists it (access.list).
export interface ShareView {
  id: string;
  resource_type: ShareResourceType;
  resource_id: string;
  scope: 'projects' | 'public' | 'user';
  project: string;
  user: string;
  level: ShareLevel;
  granted_by: string;
  inherited: boolean;
  created: string | null;
}

interface ProjectOption {
  id: string;
  name: string;
}

interface ShareRow {
  id: string;
  with: string;
  level: string;
  share: ShareView;
}

// Shares one resource (a queue, dataset, registry or credential) with the company's projects, with every company user
// (Public), or keeps it to its owner (Only me). Shown only to the users who may manage the sharing of the resource
// (manage_sharing, the collaborator level in the action table): access.list refuses everyone else, and the control then
// renders nothing. Projects offered are the ones the user owns or is a member of.
@Component({
  selector: 'sm-share-control',
  templateUrl: './share-control.component.html',
  styleUrls: ['./share-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EntityChipComponent,
    MatButton,
    MatIconButton,
    MatCheckbox,
    MatIcon,
    MatRadioGroup,
    MatRadioButton,
    MatProgressSpinner,
    PrimeTemplate,
    TableComponent,
    EmptyStateComponent,
    InlineAlertComponent,
    TooltipDirective,
  ],
})
export class ShareControlComponent implements OnInit {
  private api = inject(SmApiRequestsService);
  private dialog = inject(MatDialog);
  private store = inject(Store);

  resourceType = input.required<ShareResourceType>();
  resourceId = input.required<string>();

  protected readonly scopeChoices: ShareScopeChoice[] = ['only_me', 'projects', 'public'];
  protected readonly scopeLabels = SHARE_SCOPE_LABELS;
  protected readonly levelLabels = SHARE_LEVEL_LABELS;

  // hidden when the user may not manage the sharing of the resource (the server refused access.list)
  protected hidden = signal(false);
  protected loading = signal(true);
  protected error = signal<string | null>(null);
  protected busy = signal(false);

  protected shares = signal<ShareView[]>([]);
  protected projects = signal<ProjectOption[]>([]);

  protected scope = signal<ShareScopeChoice>('only_me');
  protected selectedProjects = signal<string[]>([]);
  protected level = signal<ShareLevel>('read');

  protected readonly levels = computed(() => SHARE_LEVELS_BY_TYPE[this.resourceType()]);

  protected readonly publicShare = computed(() => this.shares().find(share => share.scope === 'public') ?? null);

  // the projects that do not hold a share yet: a project can be shared once
  protected readonly availableProjects = computed(() => {
    const shared = new Set(this.shares().filter(share => share.scope === 'projects').map(share => share.project));
    return this.projects().filter(project => !shared.has(project.id));
  });

  protected readonly canShare = computed(() => {
    if (this.busy()) {
      return false;
    }
    switch (this.scope()) {
      case 'projects': return this.selectedProjects().length > 0;
      case 'public': return !this.publicShare();
      default: return false;
    }
  });

  protected readonly columns: ISmCol[] = [
    {id: 'with', header: 'Shared with', sortable: false},
    {id: 'level', header: 'Level', sortable: false},
    {id: 'actions', header: '', sortable: false},
  ];

  protected readonly rows = computed<ShareRow[]>(() => this.shares().map(share => ({
    id: share.id,
    with: this.withLabel(share),
    level: share.scope === 'public' ? this.levelLabels.read : this.levelLabels[share.level],
    share,
  })));

  ngOnInit() {
    this.load();
  }

  protected withLabel(share: ShareView): string {
    if (share.scope === 'public') {
      return 'Everyone in the company';
    }
    if (share.scope === 'user') {
      return `User ${share.user}`;
    }
    const name = this.projects().find(project => project.id === share.project)?.name ?? share.project;
    return share.inherited ? `${name} (added by a task run)` : name;
  }

  protected setScope(event: MatRadioChange) {
    this.scope.set(event.value);
    this.selectedProjects.set([]);
  }

  protected setLevel(event: MatRadioChange) {
    this.level.set(event.value);
  }

  protected toggleProject(id: string, checked: boolean) {
    this.selectedProjects.update(ids => checked ? [...ids, id] : ids.filter(item => item !== id));
  }

  // One share per project (one record per share). Public is always Read.
  protected async share() {
    if (!this.canShare()) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    try {
      const requests = this.scope() === 'public'
        ? [{scope: 'public', project: '', level: 'read'}]
        : this.selectedProjects().map(project => ({scope: 'projects', project, level: this.level()}));
      for (const request of requests) {
        await lastValueFrom(this.api.post(`${HTTP.API_BASE_URL}/access.share`, {
          resource_type: this.resourceType(),
          resource_id: this.resourceId(),
          ...request,
        }, {}));
      }
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'The sharing is saved'));
      this.selectedProjects.set([]);
      await this.load();
    } catch (error) {
      this.error.set(error?.meta?.result_msg ?? 'The resource could not be shared.');
    } finally {
      this.busy.set(false);
    }
  }

  // Stopping a share is destructive: the confirmation states what the people it reached lose.
  protected stop(row: ShareRow) {
    const name = this.withLabel(row.share);
    const data: ConfirmDialogConfig = {
      title: `Stop sharing with ${name}?`,
      body: row.share.scope === 'public'
        ? 'Users outside the projects you shared with will no longer be able to use it.'
        : 'Members of this project will no longer be able to use it. Tasks of the project that need it will stop working.',
      yes: 'Stop sharing',
      no: 'Cancel',
      iconClass: 'al-ico-alert',
      iconColor: 'var(--color-warning)',
      destructive: true,
    };
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(ConfirmDialogComponent, {
      data,
      panelClass: 'dialog-sm',
    }).afterClosed().subscribe(async confirmed => {
      if (!confirmed) {
        return;
      }
      this.busy.set(true);
      try {
        await lastValueFrom(this.api.post(`${HTTP.API_BASE_URL}/access.unshare`, {share_id: row.id}, {}));
        this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'Sharing stopped'));
        await this.load();
      } catch (error) {
        this.store.dispatch(addMessage(MESSAGES_SEVERITY.ERROR, error?.meta?.result_msg ?? 'The sharing could not be stopped.'));
      } finally {
        this.busy.set(false);
      }
    });
  }

  private async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [listed, access] = await Promise.all([
        lastValueFrom(this.api.post<{ shares: ShareView[] }>(`${HTTP.API_BASE_URL}/access.list`, {
          resource_type: this.resourceType(),
          resource_id: this.resourceId(),
        }, {})),
        lastValueFrom(this.api.post<{ projects: ProjectOption[] }>(`${HTTP.API_BASE_URL}/user_access.get_all`, {}, {})),
      ]);
      this.shares.set(listed.shares ?? []);
      this.projects.set(access.projects ?? []);
      this.hidden.set(false);
      this.scope.set(this.scopeOf(listed.shares ?? []));
    } catch (error) {
      // 400 (no such resource, or no level) and 403 (a level that may not manage sharing): the control is not shown
      if (error?.status === 400 || error?.status === 403) {
        this.hidden.set(true);
      } else {
        this.error.set(error?.meta?.result_msg ?? 'The sharing could not be loaded.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  // The scope shown follows the shares: a public share wins, then projects, then only the owner.
  private scopeOf(shares: ShareView[]): ShareScopeChoice {
    if (shares.some(share => share.scope === 'public')) {
      return 'public';
    }
    return shares.some(share => share.scope === 'projects') ? 'projects' : 'only_me';
  }
}
