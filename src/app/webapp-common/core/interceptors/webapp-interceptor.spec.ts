import {TestBed} from '@angular/core/testing';
import {HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {BaseLoginService} from '@common/shared/services/login.service';
import {WebappInterceptor} from './webapp-interceptor';

describe('WebappInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let logout: jasmine.Spy;

  beforeEach(() => {
    logout = jasmine.createSpy('logout');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {provide: HTTP_INTERCEPTORS, useClass: WebappInterceptor, multi: true},
        {provide: BaseLoginService, useValue: {logout}},
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('adds the client header to every request', () => {
    http.get('/api/projects.get_all').subscribe();

    const req = httpMock.expectOne('/api/projects.get_all');
    expect(req.request.headers.has('X-Cairnml-Client')).toBeTrue();
    req.flush({});
  });

  it('signs in again when an API call is refused with 401', () => {
    http.get('/api/tasks.get_all').subscribe({error: () => null});

    httpMock.expectOne('/api/tasks.get_all').flush({}, {status: 401, statusText: 'Unauthorized'});
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('signs in only once when several calls fail together', () => {
    http.get('/api/a').subscribe({error: () => null});
    http.get('/api/b').subscribe({error: () => null});

    httpMock.expectOne('/api/a').flush({}, {status: 401, statusText: 'Unauthorized'});
    httpMock.expectOne('/api/b').flush({}, {status: 401, statusText: 'Unauthorized'});
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('leaves the sign-in calls alone so that a failed sign-in cannot loop', () => {
    http.get('/login.supported_modes').subscribe({error: () => null});

    httpMock.expectOne('/login.supported_modes').flush({}, {status: 401, statusText: 'Unauthorized'});
    expect(logout).not.toHaveBeenCalled();
  });

  it('does not sign out on errors other than 401', () => {
    http.get('/api/tasks.get_all').subscribe({error: () => null});

    httpMock.expectOne('/api/tasks.get_all').flush({}, {status: 403, statusText: 'Forbidden'});
    expect(logout).not.toHaveBeenCalled();
  });

  it('passes the error on to the caller', () => {
    let status: number;
    http.get('/api/tasks.get_all').subscribe({error: (err) => status = err.status});

    httpMock.expectOne('/api/tasks.get_all').flush({}, {status: 401, statusText: 'Unauthorized'});
    expect(status).toBe(401);
  });
});
