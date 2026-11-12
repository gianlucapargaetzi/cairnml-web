import {signal} from '@angular/core';
import {Observable} from 'rxjs';
import {serverMessage} from '@common/shared/utils/server-message';
import {Board, BoardCard} from './board.model';

/** How long the board waits after the last change before it saves: a drag is one change per move, not one save per move. */
export const SAVE_DELAY_MS = 1000;

const CHANGED_BY_SOMEONE_ELSE = /changed by someone else/;

export interface BoardStateDeps {
  /** Saves the board made from `board.version`; answers with the new version. */
  save: (board: Board) => Observable<{version: number}>;
  /** The board the server holds now (null when it has none). */
  load: () => Observable<Board | null>;
  /** The board shown when the server has none. */
  fallback: () => Board;
}

/**
 * The board of one page and what is happening to it. Changes apply at once and are saved by themselves, one save at a time, each
 * made from the version the last save returned. When the server says the board was saved by someone else in the meantime the state
 * stops saving and sets `conflict`; the page offers `reload()`, which takes the server's board and drops the local changes.
 */
export class BoardState {
  readonly board = signal<Board>({version: 0, cards: []});
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly conflict = signal(false);
  readonly error = signal<string | null>(null);

  private timer: ReturnType<typeof setTimeout> | null = null;
  private dirty = false;

  constructor(private readonly deps: BoardStateDeps, private readonly delayMs = SAVE_DELAY_MS) {}

  load(board: Board | null, fallback: Board): void {
    this.board.set(board ?? fallback);
    this.dirty = false;
    this.conflict.set(false);
    this.error.set(null);
  }

  reload(): void {
    this.cancelTimer();
    this.deps.load().subscribe(board => this.load(board, this.deps.fallback()));
  }

  setEditing(on: boolean): void {
    this.editing.set(on);
    if (!on && this.dirty) {
      this.cancelTimer();
      this.flush();
    }
  }

  updateCards(cards: BoardCard[]): void {
    this.board.update(board => ({...board, cards}));
    this.changed();
  }

  addCard(card: BoardCard): void {
    this.updateCards([...this.board().cards, card]);
  }

  removeCard(id: string): void {
    this.updateCards(this.board().cards.filter(card => card.id !== id));
  }

  private changed(): void {
    this.dirty = true;
    this.cancelTimer();
    this.timer = setTimeout(() => this.flush(), this.delayMs);
  }

  private cancelTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private flush(): void {
    this.timer = null;
    if (!this.dirty || this.conflict()) {
      return;
    }
    if (this.saving()) {
      // the running save finishes first; its end saves what changed meanwhile
      return;
    }
    this.dirty = false;
    this.saving.set(true);
    this.error.set(null);
    const sent = this.board();
    this.deps.save(sent).subscribe({
      next: ({version}) => this.board.update(board => ({...board, version})),
      error: failure => {
        this.saving.set(false);
        const message = serverMessage(failure) ?? 'The board could not be saved.';
        this.dirty = true;
        if (CHANGED_BY_SOMEONE_ELSE.test(message)) {
          this.conflict.set(true);
        }
        this.error.set(message);
      },
      complete: () => {
        this.saving.set(false);
        if (this.dirty && !this.conflict()) {
          this.changed();
        }
      },
    });
  }
}
