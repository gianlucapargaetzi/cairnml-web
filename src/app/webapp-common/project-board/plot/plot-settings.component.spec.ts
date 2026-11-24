import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ErrorHandler, signal} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import {PlotDataService} from './plot-data.service';
import {PlotSettingsComponent} from './plot-settings.component';

describe('PlotSettingsComponent when its data cannot be read', () => {
  let reported: unknown[];
  let failing: {metrics?: boolean; parameters?: boolean; runs?: boolean};
  let fixture: ComponentFixture<PlotSettingsComponent>;

  const badRequest = () => throwError(() => new HttpErrorResponse({status: 400, statusText: 'Bad Request', url: '/x'}));
  const request = (name: 'metrics' | 'parameters' | 'runs', data: Observable<unknown>) => (failing[name] ? badRequest() : data);

  const configure = async () => {
    reported = [];
    await TestBed.configureTestingModule({
      imports: [PlotSettingsComponent],
      providers: [
        {
          provide: PlotDataService,
          useValue: {
            metrics: () => request('metrics', of([{metric: 'loss', variant: 'train'}])),
            parameters: () => request('parameters', of([{section: 'model', name: 'lr'}])),
            runs: () => request('runs', of({runs: [], capped: false})),
          },
        },
        {provide: ErrorHandler, useValue: {handleError: (e: unknown) => reported.push(e)}},
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PlotSettingsComponent);
    fixture.componentRef.setInput('draft', signal({}));
    fixture.componentRef.setInput('projectId', 'p1');
  };

  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  it('shows the data note and keeps the facts when the metrics request fails', async () => {
    failing = {metrics: true};
    await configure();

    await settle();

    expect(text()).toContain('The metrics and parameters of this project could not be read.');
    expect(text()).toContain('Runs per day');
    expect(reported).toEqual([]);
  });

  it('shows the data note when the parameters request fails', async () => {
    failing = {parameters: true};
    await configure();

    await settle();

    expect(text()).toContain('The metrics and parameters of this project could not be read.');
    expect(reported).toEqual([]);
  });

  it('shows the runs note when the runs request fails', async () => {
    failing = {runs: true};
    await configure();

    await settle();

    expect(text()).toContain('The runs of this project could not be read.');
    expect(reported).toEqual([]);
  });
});
