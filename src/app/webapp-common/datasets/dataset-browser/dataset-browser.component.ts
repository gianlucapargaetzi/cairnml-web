import {ChangeDetectionStrategy, Component, computed, inject, output, signal, SecurityContext} from '@angular/core';
import {DatePipe, DecimalPipe} from '@angular/common';
import {rxResource, toSignal} from '@angular/core/rxjs-interop';
import {DomSanitizer} from '@angular/platform-browser';
import {RouterLink} from '@angular/router';
import {MatTabsModule} from '@angular/material/tabs';
import {MatIcon} from '@angular/material/icon';
import {SplitAreaComponent, SplitComponent} from 'angular-split';
import {PrimeTemplate} from 'primeng/api';
import {forkJoin, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {marked} from 'marked';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
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
import {
  DatasetGroup,
  groupDatasetRuns,
  RawDatasetTask,
  RegistryEntry,
  unusedRegistryEntries
} from '../dataset-git/dataset-git.model';
import {DatasetRegistryService} from '../dataset-git/dataset-registry.service';
import {RepoAccess, RepoAccessService} from '@common/shared/services/repo-access.service';
import {RepoAccessBadgeComponent} from '@common/shared/ui-components/data/repo-access-badge/repo-access-badge.component';
import {DatasetDetails, DatasetDetailsRequest, DatasetDetailsService} from './dataset-details.service';

const TASK_LIMIT = 500;

// A row of the list: a dataset of our own (a repository used by runs), or a dataset of the registry.
export interface DatasetRow {
  id: string;
  name: string;
  kind: 'own' | 'registry';
  repository: string | null;
  registryName: string | null;
  commit: string | null;
  versions: number;
  runs: number;
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
  ],
})
export class DatasetBrowserComponent {
  private tasksApi = inject(ApiTasksService);
  private registry = inject(DatasetRegistryService);
  private detailsApi = inject(DatasetDetailsService);
  private sanitizer = inject(DomSanitizer);
  private repoAccessApi = inject(RepoAccessService);

  // The number of datasets listed, so the page can decide whether to show its empty state.
  loaded = output<number>();

  protected readonly selectedId = signal<string | null>(null);

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

  private readonly registryEntries = toSignal(
    this.registry.entries().pipe(catchError(() => of([] as RegistryEntry[]))),
    {initialValue: [] as RegistryEntry[]},
  );

  protected readonly rows = computed<DatasetRow[]>(() => {
    const listed = this.listed();
    if (!listed) {
      return [];
    }
    const used: DatasetRow[] = listed.groups.map((group: DatasetGroup) => ({
      id: group.key,
      name: group.name,
      kind: group.kind === 'own' ? 'own' : 'registry',
      repository: group.kind === 'own' ? group.repo : null,
      registryName: group.kind === 'own' ? null : group.name,
      commit: group.versions[0]?.commit ?? null,
      versions: group.versions.length,
      runs: group.runCount,
    }));
    const unused: DatasetRow[] = unusedRegistryEntries(listed.groups, this.registryEntries()).map(entry => ({
      id: 'registry:' + entry.name,
      name: entry.name,
      kind: 'registry',
      repository: null,
      registryName: entry.name,
      commit: null,
      versions: 0,
      runs: 0,
    }));
    return [...used, ...unused];
  });

  protected readonly selectedRow = computed(() => {
    const id = this.selectedId() ?? this.rows()[0]?.id ?? null;
    return this.rows().find(row => row.id === id) ?? null;
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
    params: () => this.rows(),
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
    {id: 'modalities', header: 'Modalities', sortable: false},
    {id: 'samples', header: 'Samples', sortable: true},
    {id: 'versions', header: 'Versions', sortable: true},
  ];

  protected readonly tableData = computed(() => this.rows().map(row => {
    const details = (this.rowDetails.value() ?? new Map<string, DatasetDetails>()).get(row.id);
    const modalities = Object.values(details?.metadata?.modalities ?? {});
    const samples = details?.metadata?.samples ?? null;
    return {
      id: row.id,
      name: row.name,
      kind: row.kind === 'own' ? 'Your own' : 'Registry',
      modalities: modalities.length ? modalities.join(', ') : '–',
      samples: samples === null ? '–' : samples.toLocaleString('en-US'),
      versions: row.versions,
    };
  }));

  protected select(id: string): void {
    this.selectedId.set(id);
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
