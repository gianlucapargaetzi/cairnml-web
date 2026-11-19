import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {Action, Store} from '@ngrx/store';
import {provideMockActions} from '@ngrx/effects/testing';
import {Subject} from 'rxjs';
import {HTTP} from '~/app.constants';
import {endpointUrl} from '~/business-logic/api-services/endpoints';
import {AdminService} from '~/shared/services/admin.service';
import {AppEffects} from './app.effects';
import {getParcoords, getPlot, getSample, getScalar, getSingleValues} from './app.actions';

// The report widgets' task data calls. Each one must send main's address (the task data action, with the query the
// page was opened with), main's tenant header and main's body for the action.
describe('report widgets: task data calls send main\'s address, query, header and body', () => {
  let httpMock: HttpTestingController;
  let actions$: Subject<Action>;
  let effects: AppEffects;
  let previousBase: string;
  const address = () => endpointUrl('reports.get_task_data');

  beforeEach(() => {
    previousBase = HTTP.API_BASE_URL;
    HTTP.API_BASE_URL = '/cairnml/api';
    actions$ = new Subject<Action>();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideMockActions(() => actions$),
        {provide: AdminService, useValue: {}},
        {provide: Store, useValue: {}},
        AppEffects,
      ]
    });
    httpMock = TestBed.inject(HttpTestingController);
    effects = TestBed.inject(AppEffects);
  });

  afterEach(() => {
    httpMock.verify();
    HTTP.API_BASE_URL = previousBase;
  });

  const query = () => new URLSearchParams('theme=dark&tag=a&tag=b');
  const base = {tasks: ['t1'], iterations: [1], metrics: ['loss'], variants: ['value'], company: 'company-1'};

  it('plots: main\'s body, the query of the page and the tenant header', () => {
    effects.getPlot.subscribe();
    actions$.next(getPlot({...base, models: true, otherSearchParams: query()}));

    const req = httpMock.expectOne(`${address()}?theme=dark&tag=a&tag=b`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      id: ['t1'], model_events: true, plots: {iters: 1, metrics: [{metric: 'loss', variants: ['value']}]}
    });
    expect(req.request.headers.get('X-Cairnml-Tenant')).toBe('company-1');
    req.flush({data: {tasks: [{id: 't1', project: {id: 'p1'}}], plots: {}}});
  });

  it('scalars: main\'s histogram body with the x axis key', () => {
    effects.getScalar.subscribe();
    actions$.next(getScalar({...base, models: false, xaxis: 'iter', otherSearchParams: query()}));

    const req = httpMock.expectOne(`${address()}?theme=dark&tag=a&tag=b`);
    expect(req.request.body).toEqual({
      id: ['t1'], model_events: false,
      scalar_metrics_iter_histogram: {metrics: [{metric: 'loss', variants: ['value']}], key: 'iter'}
    });
    expect(req.request.headers.get('X-Cairnml-Tenant')).toBe('company-1');
    req.flush({data: {tasks: [], scalar_metrics_iter_histogram: {}}});
  });

  it('samples: main\'s debug images body', () => {
    effects.getSample.subscribe();
    actions$.next(getSample({...base, otherSearchParams: query()}));

    const req = httpMock.expectOne(`${address()}?theme=dark&tag=a&tag=b`);
    expect(req.request.body).toEqual({id: ['t1'], debug_images: {iters: 1, metrics: [{metric: 'loss', variants: ['value']}]}});
    expect(req.request.headers.get('X-Cairnml-Tenant')).toBe('company-1');
    req.flush({data: {tasks: [], debug_images: []}});
  });

  it('parallel coordinates: main\'s only_fields body', () => {
    effects.getParcoords$.subscribe();
    actions$.next(getParcoords({...base, otherSearchParams: query()}));

    const req = httpMock.expectOne(`${address()}?theme=dark&tag=a&tag=b`);
    expect(req.request.body).toEqual({
      id: ['t1'], only_fields: ['last_metrics', 'name', 'last_iteration', 'project', 'hyperparams.value']
    });
    expect(req.request.headers.get('X-Cairnml-Tenant')).toBe('company-1');
    req.flush({data: {tasks: []}});
  });

  it('single values: main\'s body, and no query when the page has no parameters', () => {
    effects.getScalarSingleValue$.subscribe();
    actions$.next(getSingleValues({tasks: ['t1'], company: 'company-1', models: true, otherSearchParams: new URLSearchParams()}));

    const req = httpMock.expectOne(address());
    expect(req.request.body).toEqual({id: ['t1'], model_events: true, single_value_metrics: {}});
    expect(req.request.headers.get('X-Cairnml-Tenant')).toBe('company-1');
    req.flush({data: {tasks: [], single_value_metrics: []}});
  });
});
