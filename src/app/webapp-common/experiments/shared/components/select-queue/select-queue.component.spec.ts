import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Queue} from '@common/workers-and-queues/actions/queues.actions';
import {provideMockStore} from '@ngrx/store/testing';
import {BlTasksService} from '~/business-logic/services/tasks.service';
import {selectQueueFeature} from './select-queue.reducer';
import {SelectQueueComponent} from './select-queue.component';

describe('SelectQueueComponent preselection', () => {
  let fixture: ComponentFixture<SelectQueueComponent>;

  // workers: the names of the agents that listen to the queue (empty list: no agent)
  const queue = (id: string, name: string, workers: string[] = []): Queue =>
    ({id, name, caption: name, workers: workers.map(key => ({key}))} as unknown as Queue);

  const create = (queues: Queue[], previouslyUsed?: Queue) => {
    TestBed.configureTestingModule({
      imports: [SelectQueueComponent],
      providers: [
        provideMockStore({
          selectors: [
            {selector: selectQueueFeature.selectQueues, value: queues},
            {selector: selectQueueFeature.selectTasks, value: []}
          ]
        }),
        {provide: MAT_DIALOG_DATA, useValue: {taskIds: []}},
        {provide: MatDialogRef, useValue: {close: () => undefined}}
      ]
    });
    if (previouslyUsed) {
      TestBed.inject(BlTasksService).setPreviouslyUsedQueue(previouslyUsed);
    }
    fixture = TestBed.createComponent(SelectQueueComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('preselects the only non-default queue that has a worker when no queue was used before', () => {
    const component = create([
      queue('d', 'default'),
      queue('a', 'gpu-agent', ['w1'])
    ]);

    expect(component.queueControl.value).toEqual(jasmine.objectContaining({id: 'a'}));
  });

  it('preselects the previously used queue, even when another queue has a worker', () => {
    const component = create([
      queue('a', 'gpu-agent', ['w1']),
      queue('b', 'cpu-agent')
    ], queue('b', 'cpu-agent'));

    expect(component.queueControl.value).toEqual(jasmine.objectContaining({id: 'b'}));
  });

  it('keeps the first queue when two non-default queues have a worker', () => {
    const component = create([
      queue('a', 'gpu-agent', ['w1']),
      queue('b', 'cpu-agent', ['w2'])
    ]);

    expect(component.queueControl.value).toEqual(jasmine.objectContaining({id: 'a'}));
  });

  it('keeps the first queue when no queue has a worker', () => {
    const component = create([
      queue('d', 'default'),
      queue('a', 'gpu-agent')
    ]);

    expect(component.queueControl.value).toEqual(jasmine.objectContaining({id: 'd'}));
  });

  it('does not preselect the public default queue, even when it has a worker', () => {
    const component = create([
      queue('a', 'gpu-agent'),
      queue('d', 'default', ['w1'])
    ]);

    expect(component.queueControl.value).toEqual(jasmine.objectContaining({id: 'a'}));
  });

  it('lets the user change the preselected queue', () => {
    const component = create([
      queue('d', 'default'),
      queue('a', 'gpu-agent', ['w1'])
    ]);
    component.queueControl.setValue(queue('d', 'default'));

    expect(component.queueControl.value).toEqual(jasmine.objectContaining({id: 'd'}));
  });
});
