import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideMockStore} from '@ngrx/store/testing';
import {of} from 'rxjs';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {selectAppVisible} from '@common/core/reducers/view.reducer';
import {TaskProgressComponent} from './task-progress.component';

describe('TaskProgressComponent', () => {
  let fixture: ComponentFixture<TaskProgressComponent>;
  let progress: Record<string, unknown>;

  const render = (inputs: Record<string, unknown>) => {
    Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    progress = {};
    TestBed.configureTestingModule({
      imports: [TaskProgressComponent],
      providers: [
        provideMockStore({selectors: [{selector: selectAppVisible, value: true}]}),
        {provide: ApiTasksService, useValue: {tasksGetProgress: () => of({progress})}},
      ]
    });
    fixture = TestBed.createComponent(TaskProgressComponent);
  });

  it('shows nothing for a task that is not running', () => {
    const el = render({taskId: 't1', status: 'completed', mode: 'mini'});
    expect(el.classList).not.toContain('visible');
    expect(el.querySelector('.track')).toBeNull();
  });

  it('shows the bar and the percentage of a running task', () => {
    progress = {t1: {percent: 41, bars: [{label: 'epochs', n: 3, total: 8}]}};
    const el = render({taskId: 't1', status: 'in_progress', mode: 'mini'});
    expect(el.classList).toContain('visible');
    expect(el.querySelector('.fill')).not.toBeNull();
    expect(el.querySelector('.percent')?.textContent).toContain('41%');
  });

  it('shows the idle animation, and no percentage, while nothing counts', () => {
    progress = {t1: {bars: []}};
    const el = render({taskId: 't1', status: 'in_progress', mode: 'mini'});
    expect(el.querySelector('.track.idle')).not.toBeNull();
    expect(el.querySelector('.fill')).toBeNull();
    expect(el.querySelector('.percent')).toBeNull();
  });

  it('is idle for a running task that never reported', () => {
    const el = render({taskId: 'unknown', status: 'in_progress', mode: 'mini'});
    expect(el.querySelector('.track.idle')).not.toBeNull();
  });

  it('shows a ring in the circle form, spinning while idle', () => {
    progress = {t1: {percent: 20, bars: [{label: 'epochs'}]}};
    let el = render({taskId: 't1', status: 'in_progress', mode: 'circle'});
    expect(el.querySelector('mat-progress-spinner')?.getAttribute('mode')).toBe('determinate');
    expect(el.querySelector('.percent')?.textContent).toContain('20%');

    fixture = TestBed.createComponent(TaskProgressComponent);
    progress = {};
    el = render({taskId: 'idle', status: 'in_progress', mode: 'circle'});
    expect(el.querySelector('mat-progress-spinner')?.getAttribute('mode')).toBe('indeterminate');
  });

  it('shows a bar for every level with its text, the outermost first', () => {
    progress = {t1: {percent: 41, bars: [{label: 'epochs', n: 3, total: 8}, {label: 'epoch 4', n: 23, total: 80}]}};
    const el = render({taskId: 't1', status: 'in_progress', mode: 'full'});
    const texts = Array.from(el.querySelectorAll('.text')).map(t => t.textContent?.trim());
    expect(texts).toEqual(['epochs · 3 / 8 · 41%', 'epoch 4 · 23 / 80']);
    expect(el.querySelectorAll('.level.inner').length).toBe(1);
  });

  it('says that the run is working when it has no bar', () => {
    const el = render({taskId: 'none', status: 'in_progress', mode: 'full'});
    expect(el.querySelector('.text')?.textContent?.trim()).toBe('Working…');
    expect(el.querySelector('.track.idle')).not.toBeNull();
  });
});
