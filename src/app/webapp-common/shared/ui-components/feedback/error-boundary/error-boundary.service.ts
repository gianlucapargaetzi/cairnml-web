import {Injectable, signal} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';

/**
 * Holds the state of the app-wide error boundary. Set by GlobalErrorHandler when an
 * unexpected exception reaches Angular's error handler. The page shows a short message
 * and a reference id; the stack trace only goes to the browser console.
 */
@Injectable({providedIn: 'root'})
export class ErrorBoundaryService {
  readonly reference = signal<string | null>(null);

  report(error: unknown): void {
    if (this.isExpected(error)) {
      return;
    }
    if (!this.reference()) {
      this.reference.set(this.newReference());
    }
  }

  private isExpected(error: unknown): boolean {
    // Failed requests are shown by the request handlers (toasts, inline messages), not by the boundary.
    if (error instanceof HttpErrorResponse) {
      return true;
    }
    // Harmless browser notice, not a failure.
    const message = error instanceof Error ? error.message : String(error ?? '');
    return message.includes('ResizeObserver loop');
  }

  private newReference(): string {
    const time = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${time}-${random}`;
  }
}
