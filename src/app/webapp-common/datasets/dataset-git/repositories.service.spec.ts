import {TestBed} from '@angular/core/testing';
import {Observable, of, Subject, throwError} from 'rxjs';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {RepoAccessService} from '@common/shared/services/repo-access.service';
import {RepositoriesService} from './repositories.service';
import {endpointUrl} from '~/business-logic/api-services/endpoints';

describe('RepositoriesService request bodies', () => {
  let service: RepositoriesService;
  let post: jasmine.Spy;

  beforeEach(() => {
    post = jasmine.createSpy('post').and.returnValue(of({}));
    TestBed.configureTestingModule({providers: [{provide: SmApiRequestsService, useValue: {post}}]});
    service = TestBed.inject(RepositoriesService);
  });

  const lastUrl = () => post.calls.mostRecent().args[0];
  const lastBody = () => post.calls.mostRecent().args[1];

  // Each method names the repository by ref, never by id, and posts to its own action.
  const cases: [string, () => unknown, string][] = [
    ['delete', () => service.delete('r1'), 'delete'],
    ['setShared', () => service.setShared('r1', true, 'c1'), 'set_shared'],
    ['checkSharing', () => service.checkSharing('r1', 'c1'), 'check_sharing'],
    ['link', () => service.link('r1', 'p1'), 'link'],
    ['unlink', () => service.unlink('r1', 'p1'), 'unlink'],
    ['assign', () => service.assign('r1', 'c1'), 'assign'],
    ['unassign', () => service.unassign('r1'), 'unassign'],
    ['check', () => service.check('r1'), 'check'],
    ['history', () => service.history('r1'), 'get_history'],
    ['runs', () => service.runs('r1'), 'get_runs'],
    ['datasetVersions', () => service.datasetVersions('r1'), 'get_dataset_versions'],
    ['refresh', () => service.refresh('r1'), 'refresh'],
  ];

  for (const [name, invoke, action] of cases) {
    it(`${name} posts ref to repositories.${action}`, () => {
      invoke();
      expect(lastUrl()).toBe(endpointUrl(`repositories.${action}`));
      expect(lastBody().ref).toBe('r1');
      expect('id' in lastBody()).toBeFalse();
    });
  }

  it('credentials still reads user_access.get_all with an empty body', () => {
    service.credentials().subscribe();
    expect(lastUrl()).toBe(endpointUrl('user_access.get_all'));
    expect(lastBody()).toEqual({});
  });
});

describe('RepositoriesService credential changes', () => {
  function setup(response: Observable<unknown>) {
    const post = jasmine.createSpy('post').and.returnValue(response);
    TestBed.configureTestingModule({providers: [{provide: SmApiRequestsService, useValue: {post}}]});
    const notify = spyOn(TestBed.inject(RepoAccessService), 'notifyCredentialChanged');
    return {service: TestBed.inject(RepositoriesService), notify};
  }

  const changes: [string, (service: RepositoriesService) => Observable<unknown>][] = [
    ['assign', service => service.assign('r1', 'c1')],
    ['unassign', service => service.unassign('r1')],
  ];

  for (const [name, change] of changes) {
    it(`${name} tells the access service once, after the server answered`, () => {
      const answer = new Subject<unknown>();
      const {service, notify} = setup(answer);
      change(service).subscribe();
      expect(notify).not.toHaveBeenCalled();

      answer.next({repository: {}});
      expect(notify).toHaveBeenCalledTimes(1);
    });

    it(`${name} does not tell the access service when the request failed`, () => {
      const {service, notify} = setup(throwError(() => new Error('refused')));
      change(service).subscribe({error: () => undefined});

      expect(notify).not.toHaveBeenCalled();
    });
  }
});
