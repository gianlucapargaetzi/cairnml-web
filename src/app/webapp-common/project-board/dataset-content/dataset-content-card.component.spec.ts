import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Directive, ErrorHandler, Input} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {provideMockStore} from '@ngrx/store/testing';
import {BaseChartDirective} from 'ng2-charts';
import {of, throwError} from 'rxjs';
import {LineChartComponent} from '@common/shared/components/charts/line-chart/line-chart.component';
import {DatasetVersion, RepositoriesService} from '../../datasets/dataset-git/repositories.service';
import {DatasetContentCardComponent} from './dataset-content-card.component';

// The chart needs a canvas and the chart.js time scale, which the test run does not register: the chart is stubbed.
// eslint-disable-next-line @angular-eslint/directive-selector -- the selector of the chart's canvas, as in the line chart spec
@Directive({selector: 'canvas[baseChart]', standalone: true})
class MockBaseChartDirective {
  @Input() type: unknown;
  @Input() data: unknown;
  @Input() options: unknown;
  @Input() plugins: unknown;
  update() {
    // the stub draws nothing
  }
}

describe('DatasetContentCardComponent when the dataset list cannot be read', () => {
  let reported: unknown[];
  let fixture: ComponentFixture<DatasetContentCardComponent>;

  const version = {commit: 'c1', date: '2026-01-01', message: '', samples: 500, splits: {}} as unknown as DatasetVersion;

  beforeEach(async () => {
    reported = [];
    await TestBed.configureTestingModule({
      imports: [DatasetContentCardComponent],
      providers: [
        provideMockStore({}),
        {
          provide: RepositoriesService,
          useValue: {
            list: () => throwError(() => new HttpErrorResponse({status: 400, url: '/x'})),
            datasetVersions: () => of([version]),
          },
        },
        {provide: ErrorHandler, useValue: {handleError: (e: unknown) => reported.push(e)}},
      ],
    }).compileComponents();
    TestBed.overrideComponent(LineChartComponent, {remove: {imports: [BaseChartDirective]}, add: {imports: [MockBaseChartDirective]}});
    fixture = TestBed.createComponent(DatasetContentCardComponent);
    fixture.componentRef.setInput('projectId', 'p1');
    fixture.componentRef.setInput('settings', {dataset: 'd1'});
  });

  it('keeps the chart, names the card "The dataset", and reports nothing', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-id="datasetCaption"]')).not.toBeNull();
    expect(el.textContent).toContain('The dataset');
    expect(reported).toEqual([]);
  });
});
