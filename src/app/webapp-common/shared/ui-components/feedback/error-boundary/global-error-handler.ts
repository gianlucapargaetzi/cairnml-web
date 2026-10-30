import {ErrorHandler, Injectable, inject} from '@angular/core';
import {ErrorBoundaryService} from './error-boundary.service';

/**
 * Catches exceptions that nothing else handles. Logs them to the console (developers
 * need the stack) and shows the error boundary (users get no stack trace).
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private boundary = inject(ErrorBoundaryService);

  handleError(error: unknown): void {
    console.error(error);
    this.boundary.report(error);
  }
}
