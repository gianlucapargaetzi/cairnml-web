import {TestBed} from '@angular/core/testing';
import {provideMockStore} from '@ngrx/store/testing';
import {of} from 'rxjs';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {selectAppVisible} from '@common/core/reducers/view.reducer';
import {TaskProgressService} from './task-progress.service';

describe('TaskProgressService', () => {
  let service: TaskProgressService;
  let api: {tasksGetProgress: jasmine.Spy};

  beforeEach(() => {
    api = {tasksGetProgress: jasmine.createSpy('tasksGetProgress').and.returnValue(of({progress: {}}))};
    TestBed.configureTestingModule({
      providers: [
        provideMockStore({selectors: [{selector: selectAppVisible, value: true}]}),
        {provide: ApiTasksService, useValue: api},
      ]
    });
    service = TestBed.inject(TaskProgressService);
  });

  it('shows the stored progress until a live value arrives', () => {
    expect(service.percent('t1', {progress: '40', progress_label: 'epochs'})).toBe(40);
    expect(service.of('t1', {progress: '40', progress_label: 'epochs'})()).toEqual({percent: 40, bars: [{label: 'epochs'}]});
  });

  it('treats the 0 the SDK stores when it creates a task as no progress', () => {
    expect(service.percent('t1', {progress: '0'})).toBeNull();
    expect(service.of('t1', {progress: '0'})()).toBeNull();
    // a 0 with a label is a bar that has just started
    expect(service.percent('t1', {progress: '0', progress_label: 'epochs'})).toBe(0);
  });

  it('has nothing for a task without stored progress', () => {
    expect(service.percent('t1', undefined)).toBeNull();
    expect(service.percent('t1', {progress: ''})).toBeNull();
    expect(service.percent('t1', {progress: 'abc'})).toBeNull();
  });

  it('asks the server for the watched tasks only, and stops when nothing is watched', () => {
    const stop = service.watch('t1');
    TestBed.tick();
    expect(api.tasksGetProgress).toHaveBeenCalledWith({tasks: ['t1']});
    stop();
  });

  it('takes the live value over the stored one, and idle (no percentage) over both', () => {
    api.tasksGetProgress.and.returnValue(of({progress: {t1: {percent: 55, bars: [{label: 'epochs', n: 5, total: 9}]}}}));
    const stop = service.watch('t1');
    TestBed.tick();
    expect(service.percent('t1', {progress: '10'})).toBe(55);
    stop();
    TestBed.tick(); // nothing is watched: the polling stops

    api.tasksGetProgress.and.returnValue(of({progress: {t2: {bars: []}}}));
    const stopIdle = service.watch('t2');
    TestBed.tick();
    expect(service.of('t2', {progress: '70', progress_label: 'epochs'})()).toEqual({percent: null, bars: []});
    stopIdle();
  });
});
