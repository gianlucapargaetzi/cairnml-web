import {TestBed} from '@angular/core/testing';
import {of, throwError} from 'rxjs';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {RepoAccessService} from './repo-access.service';
import {endpointUrl} from '~/business-logic/api-services/endpoints';

describe('RepoAccessService.resolve', () => {
  it('posts refs and returns the repositories of the answer', () => {
    const answer = {repositories: [{repository: 'a', state: 'ok'}]};
    const post = jasmine.createSpy('post').and.returnValue(of(answer));
    TestBed.configureTestingModule({providers: [{provide: SmApiRequestsService, useValue: {post}}]});

    let result: unknown[] | undefined;
    TestBed.inject(RepoAccessService).resolve(['a', 'b'], 'p').subscribe(r => result = r);

    expect(post.calls.mostRecent().args[0]).toBe(endpointUrl('repositories.resolve'));
    expect(post.calls.mostRecent().args[1]).toEqual({refs: ['a', 'b'], project: 'p'});
    expect(result).toEqual(answer.repositories as unknown[]);
  });
});

describe('RepoAccessService failed checks', () => {
  function setup(error: unknown) {
    const post = jasmine.createSpy('post').and.returnValue(throwError(() => error));
    TestBed.configureTestingModule({providers: [{provide: SmApiRequestsService, useValue: {post}}]});
    return TestBed.inject(RepoAccessService);
  }

  it('resolve: a failed request emits an empty list and logs one warning naming the call', () => {
    const warn = spyOn(console, 'warn');
    let result: unknown[] | undefined;
    setup(new Error('boom')).resolve(['a'], 'p').subscribe(r => result = r);

    expect(result).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.calls.mostRecent().args[0])).toContain('repositories.resolve');
    expect(warn.calls.mostRecent().args[1]).toEqual(jasmine.any(Error));
  });

  it('requirement: a failed request emits an empty list and logs one warning naming the call', () => {
    const warn = spyOn(console, 'warn');
    let result: unknown[] | undefined;
    setup(new Error('boom')).requirement(['t1']).subscribe(r => result = r);

    expect(result).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.calls.mostRecent().args[0])).toContain('repositories.requirement');
    expect(warn.calls.mostRecent().args[1]).toEqual(jasmine.any(Error));
  });

  it('does not log when the request succeeds', () => {
    const warn = spyOn(console, 'warn');
    const post = jasmine.createSpy('post').and.returnValue(of({repositories: []}));
    TestBed.configureTestingModule({providers: [{provide: SmApiRequestsService, useValue: {post}}]});
    TestBed.inject(RepoAccessService).resolve(['a']).subscribe();

    expect(warn).not.toHaveBeenCalled();
  });
});
