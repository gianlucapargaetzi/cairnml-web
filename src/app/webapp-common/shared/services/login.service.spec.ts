import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {provideMockStore} from '@ngrx/store/testing';
import {MatDialog} from '@angular/material/dialog';
import {ApiLoginService} from '~/business-logic/api-services/login.service';
import {ConfigurationService} from './configuration.service';
import {UserPreferences} from '@common/user-preferences';
import {BaseLoginService} from './login.service';

describe('BaseLoginService', () => {
  let service: BaseLoginService;
  let httpMock: HttpTestingController;
  let closeAll: jasmine.Spy;

  beforeEach(() => {
    closeAll = jasmine.createSpy('closeAll');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideMockStore({}),
        {provide: ApiLoginService, useValue: {}},
        {provide: MatDialog, useValue: {closeAll}},
        {provide: ConfigurationService, useValue: {configuration: () => ({})}},
        {provide: UserPreferences, useValue: {}},
      ]
    });
    service = TestBed.inject(BaseLoginService);
    httpMock = TestBed.inject(HttpTestingController);
    spyOn(service, 'redirectToIdp');
  });

  afterEach(() => httpMock.verify());

  it('ends the CairnML session with the server, then sends the browser to the identity provider', () => {
    service.logout();

    const req = httpMock.expectOne(r => r.url.endsWith('/login.logout'));
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    expect(service.redirectToIdp).not.toHaveBeenCalled();

    req.flush(null);
    expect(service.redirectToIdp).toHaveBeenCalledTimes(1);
  });

  it('still sends the browser to the identity provider when the server cannot be reached', () => {
    service.logout();

    httpMock.expectOne(r => r.url.endsWith('/login.logout')).error(new ProgressEvent('error'));
    expect(service.redirectToIdp).toHaveBeenCalledTimes(1);
  });

  it('marks the person as signed out and closes open dialogs at once', () => {
    service.authenticated = true;

    service.logout();
    httpMock.expectOne(r => r.url.endsWith('/login.logout')).flush(null);

    expect(service.authenticated).toBeFalse();
    expect(closeAll).toHaveBeenCalled();
  });
});
