import {TestBed} from '@angular/core/testing';
import {of} from 'rxjs';
import {HTTP} from '~/app.constants';
import {SmApiRequestsService} from './api-requests.service';
import {ApiTasksService} from './tasks.service';
import {ApiLoginService} from './login.service';
import {endpointUrl} from './endpoints';

describe('API calls are sent at the version of their definition', () => {
  let post: jasmine.Spy;
  let previousBase: string;

  beforeEach(() => {
    previousBase = HTTP.API_BASE_URL;
    HTTP.API_BASE_URL = '/cairnml/api';
    post = jasmine.createSpy('post').and.returnValue(of({}));
    TestBed.configureTestingModule({providers: [{provide: SmApiRequestsService, useValue: {post}}]});
  });

  afterEach(() => {
    HTTP.API_BASE_URL = previousBase;
  });

  const sentUrl = () => post.calls.mostRecent().args[0] as string;

  it('a generated service puts the version of the definition in the path', () => {
    TestBed.inject(ApiTasksService).tasksClone({task: 't'});
    expect(sentUrl()).toBe('/cairnml/api/v2.41/tasks.clone');

    TestBed.inject(ApiTasksService).tasksClose({task: 't'});
    expect(sentUrl()).toBe('/cairnml/api/v2.1/tasks.close');
  });

  it('login.logout is called without a version, where the ID-token cookie is scoped', () => {
    TestBed.inject(ApiLoginService).loginLogout({});
    expect(sentUrl()).toBe('/cairnml/api/login.logout');
  });

  it('endpointUrl gives the same path as the generated service', () => {
    TestBed.inject(ApiTasksService).tasksClone({task: 't'});
    expect(endpointUrl('tasks.clone')).toBe(sentUrl());
    expect(endpointUrl('login.logout')).toBe('/cairnml/api/login.logout');
  });

  it('endpointUrl refuses an action the schema does not have', () => {
    expect(() => endpointUrl('tasks.no_such_action')).toThrowError(/not an action of the server's schema/);
  });

  it('no call is sent at the fixed latest version', () => {
    TestBed.inject(ApiTasksService).tasksClone({task: 't'});
    expect(sentUrl()).not.toContain('v999');
    expect(endpointUrl('projects.get_all_ex')).not.toContain('v999');
  });
});
