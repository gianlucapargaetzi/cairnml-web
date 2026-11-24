import {TestBed} from '@angular/core/testing';
import {BehaviorSubject, of, Subject, throwError} from 'rxjs';
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

describe('RepoAccessService.watch', () => {
  let service: RepoAccessService;
  let post: jasmine.Spy;
  // one open request per resolve call, answered by the test
  let pending: Subject<unknown>[];
  const answer = (repository: string, state: string) => ({repositories: [{repository, state}]});

  beforeEach(() => {
    pending = [];
    post = jasmine.createSpy('post').and.callFake(() => {
      const request = new Subject<unknown>();
      pending.push(request);
      return request;
    });
    TestBed.configureTestingModule({providers: [{provide: SmApiRequestsService, useValue: {post}}]});
    service = TestBed.inject(RepoAccessService);
  });

  function collect(repository$: BehaviorSubject<string>, project: () => string | null = () => 'p') {
    const seen: unknown[] = [];
    const subscription = service.watch(repository$, project).subscribe(access => seen.push(access));
    return {seen, subscription};
  }

  const states = (seen: unknown[]) => seen.map(access => (access as {state: string} | null)?.state ?? null);

  it('resolves the repository once and emits its access', () => {
    const {seen} = collect(new BehaviorSubject('r'));
    expect(post).toHaveBeenCalledTimes(1);
    expect(post.calls.mostRecent().args[1]).toEqual({refs: ['r'], project: 'p'});

    pending[0].next(answer('r', 'unreachable'));
    expect(states(seen)).toEqual(['unreachable']);
  });

  it('resolves the same repository again after a credential changed', () => {
    const {seen} = collect(new BehaviorSubject('r'));
    pending[0].next(answer('r', 'unreachable'));

    service.notifyCredentialChanged();
    expect(post).toHaveBeenCalledTimes(2);
    pending[1].next(answer('r', 'assigned'));

    expect(states(seen)).toEqual(['unreachable', 'assigned']);
  });

  it('emits null without a request while the repository is empty', () => {
    const {seen} = collect(new BehaviorSubject(''));
    service.notifyCredentialChanged();

    expect(post).not.toHaveBeenCalled();
    expect(seen).toEqual([null]);
  });

  it('drops the answer of the old repository when another one is named', () => {
    const repository$ = new BehaviorSubject('a');
    const {seen} = collect(repository$);
    repository$.next('b');
    pending[1].next(answer('b', 'assigned'));
    pending[0].next(answer('a', 'unreachable'));

    expect(states(seen)).toEqual(['assigned']);
  });

  it('keeps only the latest answer when a credential change and a new repository come together', () => {
    const repository$ = new BehaviorSubject('a');
    const {seen} = collect(repository$);
    service.notifyCredentialChanged();
    repository$.next('b');
    expect(post).toHaveBeenCalledTimes(3);

    pending[1].next(answer('a', 'assigned'));
    pending[2].next(answer('b', 'anonymous'));

    expect(states(seen)).toEqual(['anonymous']);
  });

  it('reads the project when it resolves, not when the watch starts', () => {
    let project = 'p1';
    collect(new BehaviorSubject('r'), () => project);
    project = 'p2';
    service.notifyCredentialChanged();

    expect(post.calls.argsFor(0)[1]).toEqual({refs: ['r'], project: 'p1'});
    expect(post.calls.argsFor(1)[1]).toEqual({refs: ['r'], project: 'p2'});
  });

  it('stops reacting to credential changes once unsubscribed', () => {
    const {subscription} = collect(new BehaviorSubject('r'));
    subscription.unsubscribe();
    service.notifyCredentialChanged();

    expect(post).toHaveBeenCalledTimes(1);
  });

  it('ends, and stops reacting to credential changes, when the repository source completes', () => {
    // what takeUntilDestroyed() does to the source when the component is destroyed
    const repository$ = new BehaviorSubject('r');
    const {subscription} = collect(repository$);
    let completed = false;
    subscription.add(() => completed = true);

    repository$.complete();
    service.notifyCredentialChanged();

    expect(completed).toBeTrue();
    expect(post).toHaveBeenCalledTimes(1);
  });
});
