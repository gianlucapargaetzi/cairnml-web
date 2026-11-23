import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {provideMockStore} from '@ngrx/store/testing';
import {BlTasksService} from '~/business-logic/services/tasks.service';
import {selectQueueFeature} from './select-queue.reducer';
import {SelectQueueComponent} from './select-queue.component';

describe('SelectQueueComponent preselection', () => {
  let fixture: ComponentFixture<SelectQueueComponent>;
  let blTasks: BlTasksService;

  const queue = (id: string, name: string, workers: unknown[] = []) => ({id, name, caption: name, workers} as any);

  const create = (queues: any[], previouslyUsed?: any) => {
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
    blTasks = TestBed.inject(BlTasksService);
    if (previouslyUsed) {
      blTasks.setPreviouslyUsedQueue(previouslyUsed);
    }
    fixture = TestBed.createComponent(SelectQueueComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('preselects the only non-default queue that has a worker when no queue was used before', () => {
    const component = create([
      queue('d', 'default'),
      queue('a', 'gpu-agent', [{key: 'w1'}])
    ]);

    expect(component.queueControl.value).toEqual(jasmine.objectContaining({id: 'a'}));
  });

  it('preselects the previously used queue, even when another queue has a worker', () => {
    const component = create([
      queue('a', 'gpu-agent', [{key: 'w1'}]),
      queue('b', 'cpu-agent')
    ], {id: 'b', name: 'cpu-agent'});

    expect(component.queueControl.value).toEqual(jasmine.objectContaining({id: 'b'}));
  });

  it('keeps the first queue when two non-default queues have a worker', () => {
    const component = create([
      queue('a', 'gpu-agent', [{key: 'w1'}]),
      queue('b', 'cpu-agent', [{key: 'w2'}])
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
      queue('d', 'default', [{key: 'w1'}])
    ]);

    expect(component.queueControl.value).toEqual(jasmine.objectContaining({id: 'a'}));
  });

  it('lets the user change the preselected queue', () => {
    const component = create([
      queue('d', 'default'),
      queue('a', 'gpu-agent', [{key: 'w1'}])
    ]);
    component.queueControl.setValue(queue('d', 'default'));

    expect(component.queueControl.value).toEqual(jasmine.objectContaining({id: 'd'}));
  });
});
