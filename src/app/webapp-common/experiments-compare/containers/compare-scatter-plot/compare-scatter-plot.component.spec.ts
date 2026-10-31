import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
// Registers the chart.js scales and elements the scatter plot uses (the app loads them the same way).
import 'chart.js/auto';

import { CompareScatterPlotComponent } from './compare-scatter-plot.component';

describe('CompareScatterPlotComponent', () => {
  let component: CompareScatterPlotComponent;
  let fixture: ComponentFixture<CompareScatterPlotComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CompareScatterPlotComponent],
      providers: [provideMockStore({})]
    });
    fixture = TestBed.createComponent(CompareScatterPlotComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('experiments', []);
    fixture.componentRef.setInput('params', [{section: 's', name: 'n'}]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
