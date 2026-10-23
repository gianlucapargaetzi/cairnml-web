import {DestroyRef, inject, signal, Signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {EMPTY, interval, Observable, startWith, switchMap, filter, catchError} from 'rxjs';

const REFRESH_MS = 5000;

/**
 * Polls a source every few seconds while the page is visible. An error keeps the last good value.
 */
export function pollWhileVisible<T>(source: () => Observable<T>): Signal<T | null> {
  const destroy = inject(DestroyRef);
  const value = signal<T | null>(null);
  interval(REFRESH_MS)
    .pipe(
      startWith(0),
      filter(() => document.visibilityState === 'visible'),
      switchMap(() => source().pipe(catchError(() => EMPTY))),
      takeUntilDestroyed(destroy),
    )
    .subscribe(result => value.set(result));
  return value.asReadonly();
}
