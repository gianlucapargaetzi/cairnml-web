import {TestBed} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {of} from 'rxjs';
import {ApiQueuesService} from '~/business-logic/api-services/queues.service';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {getQueuesForEnqueue} from './select-queue.actions';
import {SelectQueueEffects} from './select-queue.effects';

describe('SelectQueueEffects request', () => {
  it('asks for the workers of each queue and not for system tags', () => {
    const queuesGetAllEx = jasmine.createSpy('queuesGetAllEx').and.returnValue(of({queues: []}));
    TestBed.configureTestingModule({
      providers: [
        SelectQueueEffects,
        provideMockActions(() => of(getQueuesForEnqueue())),
        {provide: ApiQueuesService, useValue: {queuesGetAllEx}},
        {provide: ApiTasksService, useValue: {}}
      ]
    });
    const effects = TestBed.inject(SelectQueueEffects);
    effects.getQueuesForEnqueue$.subscribe();

    const fields: string[] = queuesGetAllEx.calls.mostRecent().args[0].only_fields;
    expect(fields).toContain('workers');
    expect(fields).not.toContain('system_tags');
  });
});
