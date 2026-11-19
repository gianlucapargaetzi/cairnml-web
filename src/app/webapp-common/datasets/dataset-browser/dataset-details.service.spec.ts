import {TestBed} from '@angular/core/testing';
import {of} from 'rxjs';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {DatasetDetailsService} from './dataset-details.service';
import {endpointUrl} from '~/business-logic/api-services/endpoints';

describe('DatasetDetailsService request body', () => {
  it('details posts the repository as ref', () => {
    const post = jasmine.createSpy('post').and.returnValue(of({}));
    TestBed.configureTestingModule({providers: [{provide: SmApiRequestsService, useValue: {post}}]});
    TestBed.inject(DatasetDetailsService).details({ref: 'x'});

    expect(post.calls.mostRecent().args[0]).toBe(endpointUrl('repositories.get_details'));
    expect(post.calls.mostRecent().args[1]).toEqual({ref: 'x'});
  });
});
