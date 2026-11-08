import {ChangeDetectionStrategy, Component, computed, effect, inject, output, signal, SecurityContext} from '@angular/core';
import {DatePipe, DecimalPipe} from '@angular/common';
import {rxResource, toSignal} from '@angular/core/rxjs-interop';
import {DomSanitizer} from '@angular/platform-browser';
import {RouterLink} from '@angular/router';
import {MatTabsModule} from '@angular/material/tabs';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {Store} from '@ngrx/store';
import {SplitAreaComponent, SplitComponent} from 'angular-split';
import {PrimeTemplate} from 'primeng/api';
import {forkJoin, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {marked} from 'marked';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {ApiUsersService} from '~/business-logic/api-services/users.service';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {SectionHeaderComponent} from '@common/shared/components/section-header/section-header.component';
import {LabeledRowComponent} from '@common/shared/ui-components/data/labeled-row/labeled-row.component';
import {CodeEditorComponent} from '@common/shared/ui-components/data/code-editor/code-editor.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {buildGitRepoUrl} from '@common/experiments/shared/common-experiments.utils';
import {presetColors} from '@common/shared/ui-components/inputs/color-picker/color-picker-wrapper.component';
import {CopyClipboardComponent} from '@common/shared/ui-components/indicators/copy-clipboard/copy-clipboard.component';
import {addMessage} from '@common/core/actions/layout.actions';
import {MESSAGES_SEVERITY} from '@common/constants';
import {selectCurrentUserId, selectIsAdmin} from '@common/core/reducers/users-reducer';
import {
  AccessDataset,
  DATASET_VISIBILITY_LABELS,
  DatasetAccessService,
  StoredCredential,
} from '../dataset-git/dataset-access.service';
import {DatasetCredentialDialogComponent} from '../dataset-credential-dialog/dataset-credential-dialog.component';
import {
  canRefreshRow,
  canRemoveRow,
  datasetListRows,
  DatasetGroup,
  DatasetRow,
  groupDatasetRuns,
  RawDatasetTask,
  RegistryEntry,
  RegistryRecord,
  removableDatasetId,
} from '../dataset-git/dataset-git.model';
import {DatasetsPageRefreshService} from '../dataset-git/datasets-page-refresh.service';
import {DatasetRegistryService} from '../dataset-git/dataset-registry.service';
import {DatasetRemovalService} from '../dataset-git/dataset-removal.service';
import {RepoAccess, RepoAccessService} from '@common/shared/services/repo-access.service';
import {RepoAccessBadgeComponent} from '@common/shared/ui-components/data/repo-access-badge/repo-access-badge.component';
import {DatasetDetails, DatasetDetailsRequest, DatasetDetailsService} from './dataset-details.service';

const TASK_LIMIT = 500;

// What the list is read from: the registries and their entries, and the datasets the user may see.
interface DirectorySnapshot {
  entries: RegistryEntry[];
  registries: RegistryRecord[];
  visible: AccessDataset[];
}

const EMPTY_DIRECTORY: DirectorySnapshot = {entries: [], registries: [], visible: []};

interface GraphNode {
  sha: string;
  message: string;
  author: string;
  date: string;
  x: number;
  y: number;
  color: string;
}

@Component({
  selector: 'sm-dataset-browser',
  templateUrl: './dataset-browser.component.html',
  styleUrls: ['./dataset-browser.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
    RouterLink,
    CopyClipboardComponent,
    RepoAccessBadgeComponent,
    MatIconButton,
    MatProgressSpinner,
  ],
})
export class DatasetBrowserComponent {
  private tasksApi = inject(ApiTasksService);
  private registry = inject(DatasetRegistryService);
  private access = inject(DatasetAccessService);
  private removal = inject(DatasetRemovalService);
  private usersApi = inject(ApiUsersService);
  private detailsApi = inject(DatasetDetailsService);
  private sanitizer = inject(DomSanitizer);
  private repoAccessApi = inject(RepoAccessService);
  private store = inject(Store);
  private dialog = inject(MatDialog);

  // The number of datasets listed, so the page can decide whether to show its empty state.
  loaded = output<number>();

  protected readonly isAdmin = toSignal(this.store.select(selectIsAdmin), {initialValue: false});
  protected readonly currentUserId = toSignal(this.store.select(selectCurrentUserId), {initialValue: null});
  protected readonly user = computed(() => ({id: this.currentUserId(), admin: this.isAdmin()}));

  // the credentials the user may choose for a dataset, to name the one a dataset is read with
  protected readonly storedCredentials = toSignal(
    this.access.credentials().pipe(catchError(() => of([] as StoredCredential[]))),
    {initialValue: [] as StoredCredential[]},
  );

  protected readonly selectedId = signal<string | null>(null);
  // the registry rows whose datasets are hidden
  protected readonly collapsed = signal<ReadonlySet<string>>(new Set());
  // the registry whose refresh is running
  protected readonly refreshingId = signal<string | null>(null);
  // bumped to read the registries and the visible datasets again after a refresh or a removal
  private readonly pageRefresh = inject(DatasetsPageRefreshService);
  private readonly reloads = signal(0);

  // The list: the datasets used by runs, and the registry entries that no run uses yet.
  private readonly listed = toSignal(
    this.tasksApi.tasksGetAllEx({
      only_fields: ['id', 'name', 'status', 'project.name', 'hyperparams', 'last_update'],
      page_size: TASK_LIMIT,
      order_by: ['-last_update'],
    }).pipe(
      map(response => (response?.tasks ?? []) as RawDatasetTask[]),
      catchError(() => of([] as RawDatasetTask[])),
    ).pipe(
      map(tasks => ({groups: groupDatasetRuns(tasks), tasks})),
    ),
    {initialValue: null as {groups: DatasetGroup[]; tasks: RawDatasetTask[]} | null},
  );

  private readonly directory = rxResource<DirectorySnapshot, number>({
    params: () => this.reloads() + this.pageRefresh.version(),
    stream: () => forkJoin({
      entries: this.registry.entries().pipe(catchError(() => of([] as RegistryEntry[]))),
      registries: this.registry.registries().pipe(catchError(() => of([] as RegistryRecord[]))),
      visible: this.access.visible().pipe(catchError(() => of([] as AccessDataset[]))),
    }),
  });

  // the names of the users, for the owner of a dataset
  private readonly userNames = toSignal(
    this.usersApi.usersGetAllEx({only_fields: ['id', 'name']}).pipe(
      map(response => new Map((response.users ?? []).map(user => [user.id, user.name] as [string, string]))),
      catchError(() => of(new Map<string, string>())),
    ),
    {initialValue: new Map<string, string>()},
  );

  protected readonly rows = computed<DatasetRow[]>(() => {
    const listed = this.listed();
    if (!listed) {
      return [];
    }
    const directory = this.directory.value() ?? EMPTY_DIRECTORY;
    return datasetListRows({groups: listed.groups, ...directory});
  });

  // both the listing and the directory have loaded at least once (a reload after an add or a removal does not reset this)
  private readonly ready = computed(() => this.listed() !== null && !this.directory.isLoading());

  // tells the page how many datasets are listed, once they are known: the page shows its empty state only when there are
  // none, never while they are still loading
  private readonly announceCount = effect(() => {
    if (this.ready()) {
      this.loaded.emit(this.rows().length);
    }
  });

  // the rows the list shows: a registry's datasets are hidden while it is collapsed
  protected readonly visibleRows = computed(() => this.rows().filter(row =>
    row.parentId === null || !this.collapsed().has(row.parentId)));

  // the rows that the side panel can show (a registry row has no details of its own)
  private readonly datasetRows = computed(() => this.rows().filter(row => row.kind !== 'registry-group'));

  protected readonly selectedRow = computed(() => {
    const id = this.selectedId() ?? this.datasetRows()[0]?.id ?? null;
    return this.datasetRows().find(row => row.id === id) ?? null;
  });

  // The runs of the selected dataset, by version. A registry entry that no run has used has no group.
  protected readonly selectedGroup = computed<DatasetGroup | null>(() => {
    const key = this.selectedRow()?.id;
    return this.listed()?.groups.find(group => group.key === key) ?? null;
  });

  private requestOf(row: DatasetRow): DatasetDetailsRequest {
    return row.kind === 'own'
      ? {repository: row.repository ?? undefined, commit: row.commit ?? undefined}
      : {registry_name: row.registryName ?? undefined};
  }

  // The details of every listed dataset, for the modalities and sample count in the list.
  private readonly rowDetails = rxResource<Map<string, DatasetDetails>, DatasetRow[]>({
    params: () => this.datasetRows(),
    stream: ({params}) => {
      if (!params.length) {
        return of(new Map<string, DatasetDetails>());
      }
      return forkJoin(params.map(row => this.detailsApi.details(this.requestOf(row)).pipe(
        map(details => [row.id, details] as [string, DatasetDetails]),
        catchError(() => of(null)),
      ))).pipe(map(pairs => new Map(pairs.filter((pair): pair is [string, DatasetDetails] => pair !== null))));
    },
  });

  // how the selected dataset's repository is reached (only for datasets of our own, which have a repository)
  protected readonly repoAccess = rxResource<RepoAccess | null, string | null>({
    params: () => this.selectedRow()?.kind === 'own' ? this.selectedRow()!.repository : null,
    stream: ({params}) => params
      ? this.repoAccessApi.resolve([params]).pipe(map(results => results[0] ?? null))
      : of(null),
  });

  protected readonly selectedDetails = rxResource<DatasetDetails | null, DatasetRow | null>({
    params: () => this.selectedRow(),
    stream: ({params}) => params
      ? this.detailsApi.details(this.requestOf(params)).pipe(catchError(() => of(null)))
      : of(null),
  });

  protected readonly columns: ISmCol[] = [
    {id: 'name', header: 'Dataset', sortable: true},
    {id: 'kind', header: 'Kind', sortable: true},
    {id: 'owner', header: 'Owner', sortable: false},
    {id: 'visibility', header: 'Visibility', sortable: false},
    {id: 'modalities', header: 'Modalities', sortable: false},
    {id: 'samples', header: 'Samples', sortable: true},
    {id: 'versions', header: 'Versions', sortable: true},
    {id: 'actions', header: '', sortable: false},
  ];

  protected readonly tableData = computed(() => {
    const details = this.rowDetails.value() ?? new Map<string, DatasetDetails>();
    return this.visibleRows().map(row => {
      const info = details.get(row.id);
      const modalities = Object.values(info?.metadata?.modalities ?? {});
      const samples = info?.metadata?.samples ?? null;
      const isParent = row.kind === 'registry-group';
      const owner = row.access?.owner ?? null;
      return {
        id: row.id,
        row,
        name: row.name,
        level: row.parentId ? 1 : 0,
        isParent,
        expanded: isParent && !this.collapsed().has(row.id),
        kind: row.kind === 'own' ? 'Your own' : isParent ? `Registry, ${row.entries} datasets` : 'Registry',
        owner: owner ? (this.userNames().get(owner) ?? owner) : '–',
        visibility: row.access ? DATASET_VISIBILITY_LABELS[row.access.visibility] ?? row.access.visibility : '–',
        modalities: isParent ? '–' : modalities.length ? modalities.join(', ') : '–',
        samples: isParent ? '–' : samples === null ? '–' : samples.toLocaleString('en-US'),
        versions: isParent ? '–' : row.versions,
        canRefresh: canRefreshRow(row, this.user()),
        canRemove: canRemoveRow(row, this.user()),
      };
    });
  });

  // A click on a registry opens or closes it; a click on a dataset selects it for the side panel.
  protected rowClicked(id: string): void {
    const row = this.rows().find(r => r.id === id);
    if (!row) {
      return;
    }
    if (row.kind === 'registry-group') {
      this.toggle(id);
    } else {
      this.select(id);
    }
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

  protected select(id: string): void {
    this.selectedId.set(id);
  }

  protected refresh(row: DatasetRow, event: Event): void {
    event.stopPropagation();
    const registryId = row.registry?.id;
    if (!registryId || this.refreshingId()) {
      return;
    }
    this.refreshingId.set(row.id);
    this.registry.refresh(registryId).subscribe({
      next: counts => {
        this.refreshingId.set(null);
        this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS,
          `Refreshed ${row.name}: ${counts?.added ?? 0} added, ${counts?.updated ?? 0} updated, ${counts?.removed ?? 0} removed`));
        this.reloads.update(n => n + 1);
      },
      error: error => {
        this.refreshingId.set(null);
        this.store.dispatch(addMessage(MESSAGES_SEVERITY.ERROR,
          error?.meta?.result_msg ?? `The registry ${row.name} could not be refreshed.`));
      },
    });
  }

  protected removeRow(row: DatasetRow, event: Event): void {
    event.stopPropagation();
    const id = removableDatasetId(row);
    if (!id) {
      return;
    }
    const isRegistry = row.kind === 'registry-group';
    const name = row.repository ?? row.name;
    this.removal.remove({id, name, kind: isRegistry ? 'registry' : 'repo'}).subscribe({
      next: removed => {
        if (!removed) {
          return;
        }
        if (this.selectedId() === row.id) {
          this.selectedId.set(null);
        }
        this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, `Removed ${name}`));
        this.reloads.update(n => n + 1);
      },
      error: error => this.store.dispatch(addMessage(MESSAGES_SEVERITY.ERROR,
        error?.meta?.result_msg ?? `${name} could not be removed.`)),
    });
  }

  // the name of the credential a dataset is read with; the id when it is not in the list the user may choose from
  protected credentialName(id: string | null): string {
    if (!id) {
      return 'None';
    }
    return this.storedCredentials().find(credential => credential.id === id)?.name ?? id;
  }

  // the owner of a dataset and the admins change its credential (the server checks the same)
  protected canSetCredential(row: DatasetRow): boolean {
    return !!row.access && (row.access.owner === this.currentUserId() || this.isAdmin());
  }

  protected setCredential(row: DatasetRow): void {
    if (!row.access) {
      return;
    }
    const dataset = row.access;
    this.dialog.open<DatasetCredentialDialogComponent, unknown, AccessDataset>(
      DatasetCredentialDialogComponent, {
        data: {
          name: dataset.name,
          credential: dataset.credential,
          save: credential => this.access.setCredential(`https://github.com/${dataset.ref}`, credential),
        },
        panelClass: 'dialog-md',
      },
    ).afterClosed().subscribe(saved => {
      if (!saved) {
        return;
      }
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, `${dataset.name} is read with ${this.credentialName(saved.credential)}`));
      this.reloads.update(n => n + 1);
    });
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
