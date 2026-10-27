import {inject, Injectable, Injector} from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {catchError} from 'rxjs/operators';
import {BaseLoginService} from '@common/shared/services/login.service';

@Injectable()
export class WebappInterceptor implements HttpInterceptor {
  // The login service needs the HTTP client, which runs this interceptor: it is taken when it is needed, not before.
  private injector = inject(Injector);
  private signingIn = false;

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    request = request.clone({
      setHeaders: {

        'X-Cairnml-Client': 'Webapp-' + environment.version,
      }
    });

    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => this.errorHandler(request, err))
    );
  }

  protected errorHandler(request: HttpRequest<any>, err: HttpErrorResponse) {
    const redirectUrl: string = window.location.pathname + window.location.search;
    // The session is over (its token has expired): go through the sign-in. Once is enough when several requests fail
    // together, and the sign-in calls themselves are left alone, so this cannot loop.
    if (err.status === 401 && !this.signingIn && request.url.indexOf('/login.') === -1) {
      if (redirectUrl.indexOf('/signup') === -1 && redirectUrl.indexOf('/login') === -1) {
        this.signingIn = true;
        this.injector.get(BaseLoginService).logout();
      }
    }
    return throwError(() => err);
  }
}
