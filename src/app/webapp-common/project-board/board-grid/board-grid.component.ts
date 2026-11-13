import {
  afterNextRender, afterRenderEffect, ChangeDetectionStrategy, Component, contentChild, DestroyRef, ElementRef, HostListener, inject, input, output,
  TemplateRef, viewChild, ViewEncapsulation
} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';
import {GridStack} from 'gridstack';
import {BoardCard, GRID_COLUMNS, SUB_ROWS} from '../board.model';
import {fromGridNodes, keyStep, toGridNode} from './grid-mapping';

/** Below this window width the board is one column (the tablet floor of the design system, `$bp-md`). */
const SINGLE_COLUMN_BELOW_PX = 960;

/**
 * The board's grid: 6 columns, quarter-tile rows, cards that snap to the cells. The cards come from `cards`; the content of a card is
 * the template the parent gives (`<ng-template #card let-card>`). The grid reports only what the user did (a drop, a resize, a key),
 * never its own tidying, through `cardsChange`. With `editable` off nothing can be dragged or resized.
 *
 * The grid is GridStack (see docs/superpowers/plans/board-spike-result.md). The tile is as high as it is wide, and a row is a quarter
 * of a tile, so the row height follows the width of the grid.
 */
@Component({
  selector: 'sm-board-grid',
  templateUrl: './board-grid.component.html',
  styleUrls: ['./board-grid.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
})
export class BoardGridComponent {
  readonly cards = input.required<BoardCard[]>();
  readonly editable = input(false);
  readonly cardsChange = output<BoardCard[]>();

  protected readonly cardTemplate = contentChild.required<TemplateRef<{$implicit: BoardCard}>>('card');
  private readonly gridElement = viewChild.required<ElementRef<HTMLElement>>('grid');
  private grid?: GridStack;
  private syncing = false;
  private observer?: ResizeObserver;

  constructor() {
    afterNextRender(() => this.create());
    afterRenderEffect(() => {
      this.cards();
      this.editable();
      this.sync();
    });
    inject(DestroyRef).onDestroy(() => {
      this.observer?.disconnect();
      this.grid?.destroy(false);
    });
  }

  private gap = 0;

  /** How many rows (a whole number of tiles) a card needs to show content that is `px` high: the next bigger tile. */
  rowsFor(px: number): number {
    const row = this.gridElement().nativeElement.getBoundingClientRect().width / (this.grid?.getColumn() === 1 ? 2 : GRID_COLUMNS) / SUB_ROWS;
    return Math.max(SUB_ROWS, Math.ceil((px + 2 * this.gap) / row / SUB_ROWS) * SUB_ROWS);
  }

  private create(): void {
    const element = this.gridElement().nativeElement;
    const gap = parseFloat(getComputedStyle(element).getPropertyValue('--space-4')) || 16;
    this.gap = gap;
    this.grid = GridStack.init({
      column: GRID_COLUMNS,
      // below the tablet floor the board is one column; columnMax keeps the full grid at 6 (the library default is 12)
      columnOpts: {columnMax: GRID_COLUMNS, breakpoints: [{w: SINGLE_COLUMN_BELOW_PX, c: 1}], breakpointForWindow: true},
      cellHeight: this.rowHeight(element.getBoundingClientRect().width, GRID_COLUMNS),
      margin: gap,
      mode: 'top',
      animate: false,
      handle: '.board-card-drag',
      resizable: {handles: 'se'},
      staticGrid: !this.editable(),
    }, element);
    this.grid.on('dragstop', () => this.report());
    this.grid.on('resizestop', (_event, item) => {
      const node = (item as HTMLElement & {gridstackNode?: {id?: string; h?: number}}).gridstackNode;
      const card = this.cards().find(candidate => candidate.id === node?.id);
      if (card && card.type !== 'divider') {
        // a card ends a resize on a whole tile
        this.grid?.update(item as HTMLElement, {h: Math.max(SUB_ROWS, Math.round((node?.h ?? card.h) / SUB_ROWS) * SUB_ROWS)});
      }
      this.report();
    });
    this.observer = new ResizeObserver(() => this.layout());
    this.observer.observe(element);
    this.layout();
  }

  /** The row height for a grid of that width: a quarter of a tile, and a tile is as high as it is wide. */
  private rowHeight(width: number, columns: number): number {
    const tile = width / (columns === 1 ? 2 : columns);
    return tile / SUB_ROWS;
  }

  private layout(): void {
    if (!this.grid) {
      return;
    }
    const width = this.gridElement().nativeElement.getBoundingClientRect().width;
    this.grid.cellHeight(this.rowHeight(width, this.grid.getColumn()));
    this.applyEditable();
  }

  private applyEditable(): void {
    // on a narrow screen the board is one column in reading order and cannot be arranged
    this.grid?.setStatic(!this.editable() || this.grid.getColumn() === 1);
  }

  /** Brings the grid in line with `cards`: new cards become widgets, removed ones leave, moved ones are placed. */
  private sync(): void {
    if (!this.grid) {
      return;
    }
    const cards = this.cards();
    const root = this.gridElement().nativeElement;
    this.syncing = true;
    this.grid.batchUpdate();
    for (const node of [...this.grid.engine.nodes]) {
      if (!cards.some(card => card.id === node.id) && node.el) {
        this.grid.removeWidget(node.el, false, false);
      }
    }
    for (const card of cards) {
      const element = root.querySelector<HTMLElement>(`:scope > [gs-id="${CSS.escape(card.id)}"]`);
      if (!element) {
        continue;
      }
      const node = (element as HTMLElement & {gridstackNode?: {x?: number; y?: number; w?: number; h?: number}}).gridstackNode;
      if (!node) {
        this.grid.makeWidget(element, toGridNode(card));
      } else if (node.x !== card.x || node.y !== card.y || node.w !== card.w || node.h !== card.h) {
        this.grid.update(element, toGridNode(card));
      }
    }
    this.grid.batchUpdate(false);
    this.syncing = false;
    this.applyEditable();
  }

  private report(): void {
    if (this.syncing || !this.grid) {
      return;
    }
    this.cardsChange.emit(fromGridNodes(this.grid.engine.nodes, this.cards()));
  }

  /** Arrow keys on the drag handle of a card move it a tile, shift and an arrow resize it a tile. */
  @HostListener('keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    const handle = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-board-handle]');
    if (!handle || !this.grid || !this.editable() || this.grid.getColumn() === 1) {
      return;
    }
    const element = handle.closest<HTMLElement>('.grid-stack-item');
    const card = this.cards().find(candidate => candidate.id === element?.getAttribute('gs-id'));
    const step = card ? keyStep(card, event.key, event.shiftKey) : null;
    if (!element || !step) {
      return;
    }
    event.preventDefault();
    this.grid.update(element, {...toGridNode(card!), ...step});
    this.report();
  }
}
