import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ErrorHandler, signal} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import {PlotDataService} from '../plot/plot-data.service';
import {ProgressSettingsComponent} from './progress-settings.component';

describe('ProgressSettingsComponent when its data cannot be read', () => {
  let reported: unknown[];
  let failing: {metrics?: boolean; runs?: boolean};
  let fixture: ComponentFixture<ProgressSettingsComponent>;

  const badRequest = () => throwError(() => new HttpErrorResponse({status: 400, statusText: 'Bad Request', url: '/x'}));
  const request = (failed: boolean | undefined, data: Observable<unknown>) => (failed ? badRequest() : data);

  const configure = async () => {
    reported = [];
    await TestBed.configureTestingModule({
      imports: [ProgressSettingsComponent],
      providers: [
        {
          provide: PlotDataService,
          useValue: {
            metrics: () => request(failing.metrics, of([{metric: 'loss', variant: 'train'}])),
            runs: () => request(failing.runs, of({runs: [{name: 'train'}], capped: false})),
          },
        },
        {provide: ErrorHandler, useValue: {handleError: (e: unknown) => reported.push(e)}},
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProgressSettingsComponent);
    fixture.componentRef.setInput('draft', signal({}));
    fixture.componentRef.setInput('projectId', 'p1');
  };

  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  it('shows the runs note when the runs request fails', async () => {
    failing = {runs: true};
    await configure();

    await settle();

    expect(text()).toContain('The runs of this project could not be read.');
    expect(reported).toEqual([]);
  });

  it('shows the metric note when the metrics request fails', async () => {
    failing = {metrics: true};
    await configure();

    await settle();

    expect(text()).toContain('The metrics of this project could not be read.');
    expect(reported).toEqual([]);
  });
});
