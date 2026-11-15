import {TestBed} from '@angular/core/testing';
import {of} from 'rxjs';
import {HTTP} from '~/app.constants';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {RepoAccessService} from './repo-access.service';

describe('RepoAccessService.resolve', () => {
  it('posts refs and returns the repositories of the answer', () => {
    const answer = {repositories: [{repository: 'a', state: 'ok'}]};
    const post = jasmine.createSpy('post').and.returnValue(of(answer));
    TestBed.configureTestingModule({providers: [{provide: SmApiRequestsService, useValue: {post}}]});

    let result: unknown[] | undefined;
    TestBed.inject(RepoAccessService).resolve(['a', 'b'], 'p').subscribe(r => result = r);

    expect(post.calls.mostRecent().args[0]).toBe(`${HTTP.API_BASE_URL}/repositories.resolve`);
    expect(post.calls.mostRecent().args[1]).toEqual({refs: ['a', 'b'], project: 'p'});
    expect(result).toEqual(answer.repositories as unknown[]);
  });
});
