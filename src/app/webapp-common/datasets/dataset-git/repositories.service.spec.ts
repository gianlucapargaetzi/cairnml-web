import {TestBed} from '@angular/core/testing';
import {of} from 'rxjs';
import {HTTP} from '~/app.constants';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {RepositoriesService} from './repositories.service';

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
      expect(lastUrl()).toBe(`${HTTP.API_BASE_URL}/repositories.${action}`);
      expect(lastBody().ref).toBe('r1');
      expect('id' in lastBody()).toBeFalse();
    });
  }

  it('credentials still reads user_access.get_all with an empty body', () => {
    service.credentials().subscribe();
    expect(lastUrl()).toBe(`${HTTP.API_BASE_URL}/user_access.get_all`);
    expect(lastBody()).toEqual({});
  });
});
