import {injectQueryParams} from 'ngxtension/inject-query-params';
import {EntityChipComponent} from '@common/shared/ui-components/tags/entity-chip/entity-chip.component';
import {ChangeDetectionStrategy, Component, computed, effect, inject, output, signal, SecurityContext} from '@angular/core';
import {DatePipe, DecimalPipe} from '@angular/common';
import {rxResource} from '@angular/core/rxjs-interop';
import {DomSanitizer} from '@angular/platform-browser';
import {RouterLink} from '@angular/router';
import {MatTabsModule} from '@angular/material/tabs';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {StatusIconLabelComponent} from '@common/shared/experiment-status-icon-label/status-icon-label.component';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {Store} from '@ngrx/store';
import {SplitAreaComponent, SplitComponent} from 'angular-split';
import {PrimeTemplate} from 'primeng/api';
import {of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {marked} from 'marked';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {SectionHeaderComponent} from '@common/shared/components/section-header/section-header.component';
import {LabeledRowComponent} from '@common/shared/ui-components/data/labeled-row/labeled-row.component';
import {CodeEditorComponent} from '@common/shared/ui-components/data/code-editor/code-editor.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {buildGitRepoUrl} from '@common/experiments/shared/common-experiments.utils';
import {presetColors} from '@common/shared/ui-components/inputs/color-picker/color-picker-wrapper.component';
import {addMessage} from '@common/core/actions/layout.actions';
import {MESSAGES_SEVERITY} from '@common/constants';
import {RepoAccess} from '@common/shared/services/repo-access.service';
import {RepoAccessBadgeComponent} from '@common/shared/ui-components/data/repo-access-badge/repo-access-badge.component';
import {RepositoryShareDialogComponent} from '../repository-share-dialog/repository-share-dialog.component';
import {assignRepoCredential} from '../dataset-credential-dialog/assign-credentials';
import {DatasetsPageRefreshService} from '../dataset-git/datasets-page-refresh.service';
import {REPO_ROLE_LABELS, Repo, RepoEntry, RepoRun, RepositoriesService} from '../dataset-git/repositories.service';
import {DatasetDetails, DatasetDetailsRequest, DatasetDetailsService} from './dataset-details.service';
import {serverMessage} from '@common/shared/utils/server-message';

// One line of the list: a repository, or, under a registry, one of the datasets it lists.
interface Row {
  id: string;
  repo: Repo;
  entry: RepoEntry | null;
  parentId: string | null;
}

interface GraphNode {
  sha: string;
  message: string;
  author: string;
  date: string;
  x: number;
  y: number;
  color: string;
}

// Repositories and datasets: code repositories, datasets and registries of datasets in one list. A registry opens into the datasets
// it lists. The side panel says how the signed-in user reads the repository and lists every credential assigned to it: the
// user's own can be changed, the others' are read-only.
@Component({
  selector: 'sm-dataset-browser',
  templateUrl: './dataset-browser.component.html',
  styleUrls: ['./dataset-browser.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EntityChipComponent,
    MatTabsModule,
    MatIcon,
    SplitComponent,
    SplitAreaComponent,
    TableComponent,
    PrimeTemplate,
    SectionHeaderComponent,
    LabeledRowComponent,
    CodeEditorComponent,
    TooltipDirective,
    ShowTooltipIfEllipsisDirective,
    DatePipe,
    DecimalPipe,
    RepoAccessBadgeComponent,
    MatButton,
    MatIconButton,
    MatProgressSpinner,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    RouterLink,
    StatusIconLabelComponent,
    TimeAgoPipe,
  ],
})
export class DatasetBrowserComponent {
  private repositories = inject(RepositoriesService);
  private detailsApi = inject(DatasetDetailsService);
  private sanitizer = inject(DomSanitizer);
  private store = inject(Store);
  private dialog = inject(MatDialog);
  private pageRefresh = inject(DatasetsPageRefreshService);

  // The number of repositories listed, so the page can decide whether to show its empty state.
  loaded = output<number>();

  protected readonly roleLabels = REPO_ROLE_LABELS;
  protected readonly selectedId = signal<string | null>(null);
  // a link from elsewhere (a task, a project's settings) names the repository to open, by its id, its name or its address
  private readonly requested = injectQueryParams('dataset');
  private readonly selectRequested = effect(() => {
    const wanted = this.requested();
    const repo = wanted ? this.repos().find(r => r.id === wanted || r.name === wanted || r.reference === wanted || r.url === wanted) : null;
    if (repo) {
      this.selectedId.set(repo.id);
    }
  });
  // the registries whose datasets are hidden
  protected readonly collapsed = signal<ReadonlySet<string>>(new Set());
  // the repository a request runs for: its check or refresh shows a spinner and the other actions wait
  protected readonly busyId = signal<string | null>(null);
  // bumped to read the list again after a change
  private readonly reloads = signal(0);

  private readonly list = rxResource<Repo[], number>({
    params: () => this.reloads() + this.pageRefresh.version(),
    stream: () => this.repositories.list().pipe(catchError(() => of([] as Repo[]))),
  });
  protected readonly repos = computed(() => this.list.value() ?? []);

  private readonly announceCount = effect(() => {
    if (!this.list.isLoading()) {
      this.loaded.emit(this.repos().length);
    }
  });

  protected readonly rows = computed<Row[]>(() => this.repos().flatMap(repo => [
    {id: repo.id, repo, entry: null, parentId: null} as Row,
    ...(repo.roles.includes('registry') && !this.collapsed().has(repo.id)
      ? (repo.entries ?? []).map(entry => ({id: entry.id, repo, entry, parentId: repo.id} as Row))
      : []),
  ]));

  protected readonly selectedRow = computed(() => {
    const id = this.selectedId() ?? this.repos()[0]?.id ?? null;
    return this.rows().find(row => row.id === id) ?? this.repos().map(repo => ({id: repo.id, repo, entry: null, parentId: null} as Row))
      .find(row => row.id === id) ?? null;
  });

  private requestOf(row: Row): DatasetDetailsRequest | null {
    if (row.entry) {
      return {entry: row.entry.id};
    }
    return row.repo.roles.includes('dataset') ? {repository: row.repo.id} : null;
  }

  protected readonly selectedDetails = rxResource<DatasetDetails | null, Row | null>({
    params: () => this.selectedRow(),
    stream: ({params}) => {
      const request = params ? this.requestOf(params) : null;
      return request ? this.detailsApi.details(request).pipe(catchError(() => of(null))) : of(null);
    },
  });

  protected readonly runColumns: ISmCol[] = [
    {id: 'name', header: 'Name', sortable: false},
    {id: 'status', header: 'Status', sortable: false, style: {width: '110px'}},
    {id: 'as', header: 'Used as', sortable: false, style: {width: '84px'}},
    {id: 'user_name', header: 'User', sortable: false, style: {width: '90px'}},
    {id: 'created', header: 'Created', sortable: false, style: {width: '110px'}},
  ];

  // The runs that used the selected repository (a registry's entries are read through the registry's runs).
  protected readonly selectedRuns = rxResource<RepoRun[], string | null>({
    params: () => this.selectedRow()?.repo.id ?? null,
    stream: ({params}) => params ? this.repositories.runs(params).pipe(catchError(() => of([] as RepoRun[]))) : of([] as RepoRun[]),
  });

  protected readonly columns: ISmCol[] = [
    {id: 'name', header: 'Name', sortable: false, style: {minWidth: '80px'}},
    {id: 'short_id', header: 'ID', sortable: false, style: {width: '96px'}},
    {id: 'type', header: 'Type', sortable: false, style: {width: '88px'}},
    {id: 'added_by', header: 'Added by', sortable: false, style: {width: '84px'}},
    {id: 'visibility', header: 'Visibility', sortable: false, style: {width: '62px'}},
    {id: 'access', header: 'Access', sortable: false, style: {width: '50px'}},
    {id: 'last_used', header: 'Last used', sortable: false, style: {width: '84px'}},
    {id: 'actions', header: '', sortable: false, style: {width: '112px'}},
  ];

  protected readonly visibilityLabels = {
    shared: 'Shared: visible to every user',
    own: 'Not shared: yours, passed on only through the projects it is used in',
    inherited: 'Not shared: it came with a project you are in',
  };

  // The credentials of the selected repository: one row for each user who reads it, with the projects it reads for.
  protected readonly credentialColumns: ISmCol[] = [
    {id: 'credential', header: 'App', sortable: false, style: {width: '110px'}},
    {id: 'owner', header: 'Owner', sortable: false, style: {width: '130px'}},
    {id: 'state', header: 'Access', sortable: false, style: {width: '60px'}},
    {id: 'projects', header: 'Project', sortable: false},
    {id: 'last_used', header: 'Last used', sortable: false, style: {width: '84px'}},
    {id: 'actions', header: '', sortable: false, style: {width: '112px'}},
  ];

  protected credentialRows(repo: Repo) {
    return repo.assignments.map(assignment => ({
      id: assignment.id || `owner-${assignment.user}`,
      assignment,
      credential: assignment.credential_name || '–',
      owner: assignment.mine ? `${assignment.user_name} (you)` : assignment.user_name,
      last_used: assignment.last_used ? new Date(assignment.last_used).toLocaleDateString(undefined, {dateStyle: 'short'}) : '–',
    }));
  }


  protected readonly tableData = computed(() => this.rows().map(row => ({
    id: row.id,
    row,
    name: row.entry ? row.entry.name : row.repo.name,
    full_id: row.entry ? row.entry.id : row.repo.id,
    short_id: (row.entry ? row.entry.id : row.repo.id).slice(0, 8),
    canShare: !row.entry && row.repo.can_share && !row.repo.shared,
    canUnshare: !row.entry && row.repo.can_share && row.repo.shared,
    level: row.parentId ? 1 : 0,
    isParent: !row.entry && row.repo.roles.includes('registry'),
    expanded: !row.entry && row.repo.roles.includes('registry') && !this.collapsed().has(row.repo.id),
    type: row.entry ? 'Registry dataset' : row.repo.roles.map(role => this.roleLabels[role]).join(', '),
    added_by: row.entry ? '' : (row.repo.shared ? 'Company' : row.repo.owner_name),
    visibility: row.entry ? null : row.repo.relation,
    visibilityLabel: row.entry ? '' : this.visibilityLabels[row.repo.relation],
    access: row.entry ? null : this.accessOf(row.repo),
    last_used: row.entry || !row.repo.last_used ? '–' : new Date(row.repo.last_used).toLocaleDateString(undefined, {dateStyle: 'short'}),
    canCheck: !row.entry,
    isRegistry: !row.entry && row.repo.roles.includes('registry'),
    isEntry: !!row.entry,
    canDelete: !row.entry && row.repo.can_delete,
    deleteBlocked: row.entry ? '' : (row.repo.delete_blocked ?? ''),
  })));

  protected accessOf(repo: Repo): RepoAccess {
    return {
      repository: repo.url, url: repo.url, id: repo.id, project: null, state: repo.access.state,
      via: repo.assignments.find(a => a.mine)?.credential_name ?? '',
      message: repo.access.message, warning: repo.access.warning, can_assign: repo.can_assign, ask: false,
    };
  }

  // A click on a registry opens or closes it; any click selects the line for the side panel.
  protected rowClicked(id: string): void {
    const row = this.rows().find(r => r.id === id);
    if (!row) {
      return;
    }
    if (!row.entry && row.repo.roles.includes('registry')) {
      this.toggle(id);
    }
    this.selectedId.set(id);
  }

  protected toggle(id: string): void {
    this.collapsed.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  private reload(): void {
    this.reloads.update(n => n + 1);
  }

  private fail(error: {meta?: {result_msg?: string}}, fallback: string): void {
    this.store.dispatch(addMessage(MESSAGES_SEVERITY.ERROR, serverMessage(error) ?? fallback));
  }

  // Looks at the repository again (a registry is read again); the answer is a message.
  protected check(repo: Repo, event?: Event): void {
    event?.stopPropagation();
    if (this.busyId()) {
      return;
    }
    this.busyId.set(repo.id);
    const name = `${repo.host}/${repo.path}`;
    if (repo.roles.includes('registry')) {
      this.repositories.refresh(repo.id).subscribe({
        next: ({counts}) => {
          this.busyId.set(null);
          this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS,
            `Refreshed ${name}: ${counts.added} added, ${counts.updated} updated, ${counts.removed} removed`));
          this.reload();
        },
        error: error => {
          this.busyId.set(null);
          this.fail(error, `${name} could not be refreshed.`);
        },
      });
      return;
    }
    this.repositories.check(repo.id).subscribe({
      next: checked => {
        this.busyId.set(null);
        const ok = checked.state === 'ok';
        this.store.dispatch(addMessage(ok ? MESSAGES_SEVERITY.SUCCESS : MESSAGES_SEVERITY.WARN,
          ok ? `Checked ${name}: ${checked.access.message || 'it can be read'}` : `Checked ${name}: ${checked.state_message || 'no access'}`));
        this.reload();
      },
      error: error => {
        this.busyId.set(null);
        this.fail(error, `${name} could not be checked.`);
      },
    });
  }

  private confirm(title: string, body: string, yes: string, destructive: boolean) {
    const data: ConfirmDialogConfig = {
      title, body, yes, no: 'Cancel', iconClass: 'al-ico-alert', iconColor: 'var(--color-warning)', destructive,
    };
    return this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(ConfirmDialogComponent, {
      data, panelClass: 'dialog-sm',
    }).afterClosed();
  }

  protected delete(repo: Repo, event?: Event): void {
    event?.stopPropagation();
    this.confirm('Delete repository?',
      `${repo.host}/${repo.path} is removed for you, with your credential assignment. Other users who still use it keep it. ` +
      'Nothing changes in the repository itself.', 'Delete', true).subscribe(confirmed => {
      if (!confirmed) {
        return;
      }
      this.repositories.delete(repo.id).subscribe({
        next: () => {
          if (this.selectedId() === repo.id) {
            this.selectedId.set(null);
          }
          this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, `Deleted ${repo.host}/${repo.path}`));
          this.reload();
        },
        error: error => this.fail(error, `${repo.host}/${repo.path} could not be deleted.`),
      });
    });
  }

  // Making a repository shared: the company credential is chosen and checked in a dialog, then confirmed once more there.
  protected openShareDialog(repo: Repo, event?: Event): void {
    event?.stopPropagation();
    this.dialog.open<RepositoryShareDialogComponent, {repo: Repo}, boolean>(RepositoryShareDialogComponent, {
      data: {repo}, panelClass: 'dialog-sm',
    }).afterClosed().subscribe(done => done && this.reload());
  }

  protected share(repo: Repo, shared: boolean): void {
    if (shared) {
      this.openShareDialog(repo);
      return;
    }
    this.confirm(shared ? 'Make it shared?' : 'Make it non-shared?',
      shared
        ? 'It becomes owned by the admin and is visible to every user. Your own credential assignment is dropped; you can assign a ' +
        'company credential afterwards.'
        : 'It is no longer visible to everyone: only its owner and the projects it is listed in see it.',
      shared ? 'Make shared' : 'Make non-shared', false).subscribe(confirmed => {
      if (!confirmed) {
        return;
      }
      this.repositories.setShared(repo.id, shared).subscribe({
        next: () => {
          this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, shared ? `${repo.name} is shared` : `${repo.name} is non-shared`));
          this.reload();
        },
        error: error => this.fail(error, 'The sharing could not be changed.'),
      });
    });
  }

  // Assigns the signed-in user's own credential, or changes it.
  protected assign(repo: Repo): void {
    assignRepoCredential(this.dialog, this.repositories, repo).subscribe(saved => {
      if (saved) {
        this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, `${repo.host}/${repo.path} is read with your new credential`));
        this.reload();
      }
    });
  }

  protected unassign(repo: Repo): void {
    this.confirm('Delete your credential?', `You stop reading ${repo.host}/${repo.path} with it. Other users' credentials stay.`,
      'Delete', true).subscribe(confirmed => {
      if (confirmed) {
        this.repositories.unassign(repo.id).subscribe({next: () => this.reload(), error: error => this.fail(error, 'It could not be deleted.')});
      }
    });
  }

  protected unlinkProject(repo: Repo, project: string): void {
    this.repositories.unlink(repo.id, project).subscribe({next: () => this.reload(), error: error => this.fail(error, 'It could not be taken out.')});
  }

  protected canEditAny(repo: Repo): boolean {
    return repo.assignments.some(assignment => assignment.can_edit);
  }

  protected repoLink(details: DatasetDetails) {
    return buildGitRepoUrl(details.repository ?? '', null, details.revision);
  }

  protected entries(record: Record<string, string | number> | undefined | null): [string, string | number][] {
    return Object.entries(record ?? {});
  }

  protected storageLabel(storage: string | null): string {
    switch (storage) {
      case 'lfs': return 'GitHub LFS';
      case 's3': return 'DVC storage';
      default: return 'storage not recorded';
    }
  }

  protected shortSha(sha: string | null): string {
    return sha ? sha.slice(0, 7) : '–';
  }

  // The description as blocks: text as sanitized HTML, code as code cells.
  protected descriptionBlocks(details: DatasetDetails) {
    return marked.lexer(details.description ?? '').map(token => token.type === 'code'
      ? {code: token.text, mode: this.codeMode(token.lang)}
      : {html: this.sanitizer.sanitize(SecurityContext.HTML, marked.parser([token]) as string) ?? ''});
  }

  protected codeMode(lang?: string): string {
    const name = (lang ?? '').toLowerCase();
    if (['python', 'py'].includes(name)) { return 'python'; }
    if (['yaml', 'yml'].includes(name)) { return 'yaml'; }
    return 'sh';
  }

  protected codeHeight(code: string): number {
    return code.split('\n').length * 21 + 20;
  }

  // The commit graph: one lane per branch line. The first parent continues the lane of its child; other parents open a new lane.
  protected graph(details: DatasetDetails) {
    const rowHeight = 36;
    const laneWidth = 24;
    const left = 16;
    const top = 24;
    const palette = presetColors;
    const active: string[] = [];
    const laneColor: string[] = [];
    let branches = 0;
    const place = new Map<string, {x: number; y: number; color: string}>();
    details.commits.forEach((commit, row) => {
      let lane = active.indexOf(commit.sha);
      if (lane < 0) {
        lane = active.indexOf('');
        if (lane < 0) { lane = active.length; active.push(''); }
        laneColor[lane] = palette[branches++ % palette.length];
      }
      active[lane] = '';
      place.set(commit.sha, {x: left + lane * laneWidth, y: top + row * rowHeight, color: laneColor[lane]});
      commit.parents.forEach((parent, k) => {
        if (active.includes(parent)) { return; }
        let slot = k === 0 ? lane : active.indexOf('');
        if (slot < 0) { slot = active.length; active.push(''); }
        if (k > 0 && !laneColor[slot]) { laneColor[slot] = palette[branches++ % palette.length]; }
        active[slot] = parent;
      });
    });
    const edges = details.commits.flatMap(commit => commit.parents
      .filter(parent => place.has(parent))
      .map(parent => ({from: place.get(commit.sha)!, to: place.get(parent)!})));
    const lanes = Math.max(1, ...Array.from(place.values(), v => (v.x - left) / laneWidth + 1));
    const nodes: GraphNode[] = details.commits.map(commit => ({...commit, ...place.get(commit.sha)!}));
    return {
      nodes,
      edges,
      graphWidth: left * 2 + lanes * laneWidth,
      height: top * 2 + details.commits.length * rowHeight,
    };
  }

  // A cubic curve from a commit down to one of its parents.
  protected curve(e: {from: {x: number; y: number}; to: {x: number; y: number}}): string {
    const mid = (e.from.y + e.to.y) / 2;
    return `M${e.from.x} ${e.from.y} C${e.from.x} ${mid} ${e.to.x} ${mid} ${e.to.x} ${e.to.y}`;
  }
}
