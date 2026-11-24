import {LocationStrategy} from '@angular/common';
import {TestBed} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Action} from '@ngrx/store';
import {of, Subject} from 'rxjs';
import {ApiLoginService} from '~/business-logic/api-services/login.service';
import {ApiServerService} from '~/business-logic/api-services/server.service';
import {ApiUsersService} from '~/business-logic/api-services/users.service';
import {BaseLoginService} from '@common/shared/services/login.service';
import {ErrorService} from '../../shared/services/error.service';
import {getApiVersion, setApiVersion} from '../actions/users.actions';
import {CommonUserEffects} from './users.effects';

describe('CommonUserEffects.getApiVersion', () => {
  let actions$: Subject<Action>;
  let serverInfo: jasmine.Spy;
  let emitted: Action[];

  // Asks the server for its version and returns the action the effect emits for the reply.
  const replyWith = (info: object) => {
    serverInfo.and.returnValue(of(info));
    actions$.next(getApiVersion());
    return emitted;
  };

  beforeEach(() => {
    actions$ = new Subject<Action>();
    serverInfo = jasmine.createSpy('serverInfo');
    TestBed.configureTestingModule({
      providers: [
        CommonUserEffects,
        provideMockActions(() => actions$),
        {provide: ApiServerService, useValue: {serverInfo}},
        {provide: ApiUsersService, useValue: {}},
        {provide: ApiLoginService, useValue: {}},
        {provide: BaseLoginService, useValue: {}},
        {provide: LocationStrategy, useValue: {}},
        {provide: ErrorService, useValue: {}},
      ]
    });
    emitted = [];
    TestBed.inject(CommonUserEffects).getApiVersion.subscribe(action => emitted.push(action));
  });

  it('shows the server version without a trailing hyphen when the build is empty', () => {
    expect(replyWith({version: '0.0.6', build: '', api_version: '2.41'})).toEqual([
      setApiVersion({serverVersions: {server: '0.0.6', api: '2.41'}})
    ]);
  });

  it('joins the build number to the server version when the build is set', () => {
    expect(replyWith({version: '0.0.6', build: '123', api_version: '2.41'})).toEqual([
      setApiVersion({serverVersions: {server: '0.0.6-123', api: '2.41'}})
    ]);
  });
});
