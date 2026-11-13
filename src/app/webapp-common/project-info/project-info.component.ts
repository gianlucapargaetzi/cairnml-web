import {
  ChangeDetectionStrategy, Component, computed, effect, inject, resource, signal, untracked, viewChild
} from '@angular/core';
import {Store} from '@ngrx/store';
import {MatDialog} from '@angular/material/dialog';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {combineLatest, firstValueFrom} from 'rxjs';
import {debounceTime, filter, map, take} from 'rxjs/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {injectQueryParams} from 'ngxtension/inject-query-params';
import {selectIsDeepMode, selectSelectedMetricVariantForCurrProject, selectSelectedProject} from '../core/reducers/projects.reducer';
import {setBreadcrumbsOptions} from '../core/actions/projects.actions';
import {HeaderMenuService} from '~/shared/services/header-menu.service';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {InlineAlertComponent} from '@common/shared/ui-components/feedback/inline-alert/inline-alert.component';
import {MatButton} from '@angular/material/button';
import {BoardGridComponent} from '@common/project-board/board-grid/board-grid.component';
import {BoardCardComponent} from '@common/project-board/board-card/board-card.component';
import {AddCardDialogComponent} from '@common/project-board/add-card-dialog/add-card-dialog.component';
import {CardSettingsDialogComponent} from '@common/project-board/card-settings-dialog/card-settings-dialog.component';
import {BoardService} from '@common/project-board/board.service';
import {BoardState} from '@common/project-board/board-state';
import {BoardCard, BoardCardType} from '@common/project-board/board.model';
import {defaultBoard} from '@common/project-board/default-board';
import {nextFreePosition} from '@common/project-board/board-layout';
import {CARD_TYPES} from '@common/project-board/card-registry';

/**
 * The overview of a project: its board of cards. Everyone who can read the project sees the same board; the project's owner (and a
 * company admin) can arrange it. A project that never saved a board shows the default board, which is the content of the old
 * overview as cards.
 */
/** How long a new card may still grow to fit its content. */
const FIT_WINDOW_MS = 8000;

@Component({
  selector: 'sm-project-info',
  templateUrl: './project-info.component.html',
  styleUrls: ['./project-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconButton, MatButton, MatIcon, MatProgressSpinner, TooltipDirective, InlineAlertComponent, BoardGridComponent, BoardCardComponent,
  ],
})
export class ProjectInfoComponent {
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);
  private readonly boards = inject(BoardService);
  private readonly headerMenu = inject(HeaderMenuService);
  private readonly archive = injectQueryParams('archive');

  protected readonly project = this.store.selectSignal(selectSelectedProject);
  protected readonly projectId = computed(() => this.project()?.id);

  /** What the board is doing, one per project. */
  protected readonly state = computed(() => {
    const id = this.projectId() ?? '';
    return new BoardState({
      save: board => this.boards.set(id, board),
      load: () => this.boards.get(id).pipe(map(loaded => loaded.board)),
      fallback: defaultBoard,
    });
  });

  private readonly saved = resource({
    params: () => this.projectId(),
    loader: ({params}) => firstValueFrom(this.boards.get(params)),
  });
  protected readonly ready = computed(() => this.saved.status() === 'resolved' || this.saved.status() === 'error');
  /** Only the owner of the project arranges the board; the server says who that is (a company admin passes the same check). */
  protected readonly canEdit = computed(() => this.saved.status() === 'resolved' && !!this.saved.value()?.canEdit);

  constructor() {
    effect(() => {
      if (this.ready()) {
        const board = this.saved.status() === 'resolved' ? this.saved.value()?.board ?? null : null;
        untracked(() => this.state().load(board, defaultBoard()));
      }
    });
    effect(() => {
      if (this.projectId()) {
        untracked(() => this.headerMenu.setupProjectHeaderTabs('overview', this.projectId()!, this.archive() === 'true'));
      }
    });
    this.setupBreadcrumbsOptions();
    this.store.select(selectSelectedMetricVariantForCurrProject).pipe(filter(data => !!data), take(1)).subscribe();
  }

  protected toggleEditing(): void {
    this.state().setEditing(!this.state().editing());
  }

  protected readonly fitting = signal<ReadonlySet<string>>(new Set());
  private readonly grid = viewChild(BoardGridComponent);

  /** A new card reported how high its content is: it takes the next whole tile that shows all of it. */
  protected fitCard(card: BoardCard, px: number): void {
    const rows = this.grid()?.rowsFor(px);
    const state = this.state();
    const current = state.board().cards.find(candidate => candidate.id === card.id);
    if (rows && current && rows !== current.h) {
      state.updateCards(state.board().cards.map(candidate => candidate.id === card.id ? {...candidate, h: rows} : candidate));
    }
  }

  protected addCard(): void {
    this.dialog.open<AddCardDialogComponent, void, BoardCardType | undefined>(AddCardDialogComponent, {panelClass: 'dialog-md'})
      .afterClosed().subscribe(type => {
        if (!type) {
          return;
        }
        const def = CARD_TYPES[type];
        const state = this.state();
        const card: BoardCard = {
          id: `${type}-${crypto.randomUUID().slice(0, 8)}`, type, ...nextFreePosition(state.board().cards),
          w: def.defaultSize.w, h: def.defaultSize.h, settings: def.defaultSettings(),
        };
        state.addCard(card);
        if (def.fit) {
          this.fitting.update(ids => new Set(ids).add(card.id));
          // the card has had time to load by now; after that its size is the owner's
          setTimeout(() => this.fitting.update(ids => new Set([...ids].filter(id => id !== card.id))), FIT_WINDOW_MS);
        }
      });
  }

  protected editCard(card: BoardCard): void {
    this.dialog.open<CardSettingsDialogComponent, {card: BoardCard; projectId: string}, Record<string, unknown> | undefined>(
      CardSettingsDialogComponent, {panelClass: 'dialog-md', data: {card, projectId: this.projectId()!}})
      .afterClosed().subscribe(settings => {
        if (settings) {
          const state = this.state();
          state.updateCards(state.board().cards.map(candidate => candidate.id === card.id ? {...candidate, settings} : candidate));
        }
      });
  }

  private setupBreadcrumbsOptions(): void {
    combineLatest([this.store.select(selectSelectedProject), this.store.select(selectIsDeepMode)])
      .pipe(takeUntilDestroyed(), debounceTime(0))
      .subscribe(([selectedProject, isDeep]) => this.store.dispatch(
        setBreadcrumbsOptions({
          breadcrumbOptions: {
            showProjects: !!selectedProject,
            featureBreadcrumb: {name: 'Projects', url: 'projects'},
            ...(isDeep && selectedProject?.id !== '*' && {subFeatureBreadcrumb: {name: 'All Tasks'}}),
            projectsOptions: {
              basePath: 'projects',
              filterBaseNameWith: null,
              compareModule: null,
              showSelectedProject: selectedProject?.id !== '*',
              ...(selectedProject && {
                selectedProjectBreadcrumb: {
                  name: selectedProject?.id === '*' ? 'All Tasks' : selectedProject?.basename,
                  url: `projects/${selectedProject?.id}/projects`,
                },
              }),
            },
          },
        })
      ));
  }
}
