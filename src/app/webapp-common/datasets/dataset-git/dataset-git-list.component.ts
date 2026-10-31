import {ChangeDetectionStrategy, Component, ElementRef, inject, output, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {MatExpansionModule} from '@angular/material/expansion';
import {map} from 'rxjs/operators';
import {forkJoin, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {CopyClipboardComponent} from '@common/shared/ui-components/indicators/copy-clipboard/copy-clipboard.component';
import {
  DatasetGroup,
  groupDatasetRuns,
  RawDatasetTask,
  RegistryEntry,
  unusedRegistryEntries
} from './dataset-git.model';
import {DatasetRegistryService} from './dataset-registry.service';

const TASK_LIMIT = 500;

@Component({
  selector: 'sm-dataset-git-list',
  templateUrl: './dataset-git-list.component.html',
  styleUrls: ['./dataset-git-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatExpansionModule, CopyClipboardComponent]
})
export class DatasetGitListComponent {
  private tasksApi = inject(ApiTasksService);
  private registry = inject(DatasetRegistryService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private route = inject(ActivatedRoute);

  // Count of listed datasets (used by runs, and registered but unused), so the parent can hide its own empty state.
  loaded = output<number>();
  readonly taskLimit = TASK_LIMIT;

  // The dataset a link from a task opens: its panel is expanded and brought into view.
  focusKey = toSignal(this.route.queryParamMap.pipe(map(params => params.get('dataset') ?? '')), {initialValue: ''});

  groups = signal<DatasetGroup[]>([]);
  unused = signal<RegistryEntry[]>([]);
  loading = signal(true);
  failed = signal(false);
  truncated = signal(false);

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.failed.set(false);
    forkJoin({
      tasks: this.tasksApi.tasksGetAllEx({
        only_fields: ['id', 'name', 'status', 'project.name', 'hyperparams', 'last_update'],
        page_size: TASK_LIMIT,
        order_by: ['-last_update']
      }),
      // The registry is optional for this list: when it cannot be read, the used datasets are still shown.
      registry: this.registry.entries().pipe(catchError(() => of([] as RegistryEntry[])))
    }).subscribe({
      next: ({tasks, registry}) => {
        const rawTasks: RawDatasetTask[] = tasks?.tasks ?? [];
        const groups = groupDatasetRuns(rawTasks);
        const unused = unusedRegistryEntries(groups, registry);
        this.truncated.set(rawTasks.length >= TASK_LIMIT);
        this.groups.set(groups);
        this.unused.set(unused);
        this.loading.set(false);
        this.loaded.emit(groups.length + unused.length);
        this.scrollToFocus();
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
        this.loaded.emit(0);
      }
    });
  }

  private scrollToFocus() {
    const key = this.focusKey();
    if (!key) {
      return;
    }
    setTimeout(() => {
      const element = this.host.nativeElement.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`);
      element?.scrollIntoView({block: 'start'});
    });
  }

  storageLabel(storage: string | null): string {
    switch (storage) {
      case 'lfs': return 'GitHub LFS';
      case 's3': return 'DVC storage';
      default: return 'storage not recorded';
    }
  }
}
