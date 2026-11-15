import {Component, signal} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {of} from 'rxjs';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {TaskProgressService} from '@common/shared/ui-components/data/task-progress/task-progress.service';
import {RecentExperimentsComponent} from './recent-experiments.component';

const MINUTE = 60 * 1000;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const TASKS = [
  {id: 't1', name: 'failed run', status: 'failed', created: ago(12 * MINUTE)},
  {id: 't2', name: 'completed run', status: 'completed', created: ago(25 * MINUTE)},
  {id: 't3', name: 'another failed run', status: 'failed', created: ago(4 * 60 * MINUTE)},
  {id: 't4', name: 'aborted run', status: 'stopped', created: ago(4 * 60 * MINUTE)},
  {id: 't5', name: 'a running run with a very long name that has to give way to the other columns first', status: 'in_progress',
    created: ago(6 * 60 * MINUTE), runtime: {progress: '40', progress_label: 'epoch'}}
];

@Component({
  selector: 'sm-host',
  imports: [RecentExperimentsComponent],
  template: `<div [style.width.px]="width()"><sm-recent-experiments projectId="p1"></sm-recent-experiments></div>`
})
class HostComponent {
  width = signal(600);
}

describe('recent experiments rows', () => {
  let fixture: ComponentFixture<HostComponent>;

  const rects = (selector: string) =>
    Array.from(fixture.nativeElement.querySelectorAll(`.recent-list li ${selector}`) as NodeListOf<HTMLElement>)
      .map(element => element.getBoundingClientRect());
  const spread = (values: number[]) => Math.max(...values) - Math.min(...values);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideRouter([]),
        {provide: ApiTasksService, useValue: {tasksGetAllEx: () => of({tasks: TASKS})}},
        {provide: TaskProgressService, useValue: {of: () => signal({percent: 40, bars: [{label: 'epoch', n: 4, total: 10}]}), watch: () => () => undefined}}
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('start their status labels at the same x whatever the time text is', () => {
    const labels = rects('sm-status-icon-label');
    expect(labels.length).toBe(5);
    expect(spread(labels.map(rect => rect.left)))
      .withContext('status label left edges differ by px (spread must be <= 0.5)').toBeLessThanOrEqual(0.5);
  });

  it('keep the time column on the right edge and shrink the name first', () => {
    const list = fixture.nativeElement.querySelector('.recent-list').getBoundingClientRect() as DOMRect;
    const times = rects('.experiment-time');
    expect(spread(times.map(rect => rect.right))).withContext('time right edges differ').toBeLessThanOrEqual(0.5);
    expect(Math.abs(times[0].right - list.right)).withContext('time is not at the list edge').toBeLessThanOrEqual(0.5);

    fixture.componentInstance.width.set(320);
    fixture.detectChanges();
    const names = rects('.experiment-name');
    expect(Math.min(...names.map(rect => rect.width))).toBeGreaterThan(0);
    const labels = rects('sm-status-icon-label');
    expect(spread(labels.map(rect => rect.left))).toBeLessThanOrEqual(0.5);
    labels.forEach((label, index) => expect(label.left).toBeGreaterThanOrEqual(names[index].right));
  });
});
