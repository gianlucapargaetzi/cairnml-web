import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {ApiEventsService} from './events.service';
import {ApiOrganizationService} from './organization.service';
import {ApiReportsService} from './reports.service';
import {endpointUrl} from './endpoints';

// The calls that were on endpointUrl(action) before the generated layer could express them: the download link of the
// experiments table, the task log download, and the task data calls. Each one must send the address main sent, the
// same query, headers and body, and the response type the download needs.
describe('the calls that were on endpointUrl send main\'s address, query, headers, body and response type', () => {
  let httpMock: HttpTestingController;
  let events: ApiEventsService;
  let organization: ApiOrganizationService;
  let reports: ApiReportsService;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    httpMock = TestBed.inject(HttpTestingController);
    events = TestBed.inject(ApiEventsService);
    organization = TestBed.inject(ApiOrganizationService);
    reports = TestBed.inject(ApiReportsService);
  });

  afterEach(() => httpMock.verify());

  it('the download link of the experiments table is main\'s address with prepare_id as the query', () => {
    expect(organization.organizationDownloadForGetAllUrl({prepare_id: 'abc123'}))
      .toBe(`${endpointUrl('organization.download_for_get_all')}?prepare_id=abc123`);
  });

  it('the download of the table is a GET of the same address, returned as a Blob', () => {
    let result: Blob | undefined;
    organization.organizationDownloadForGetAll({prepare_id: 'abc123'}).subscribe(blob => result = blob);

    const req = httpMock.expectOne(`${endpointUrl('organization.download_for_get_all')}?prepare_id=abc123`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    expect(req.request.headers.has('X-Cairnml-Tenant')).toBeFalse();
    const file = new Blob(['a,b']);
    req.flush(file);
    expect(result).toBe(file);
  });

  it('the task log is a POST of main\'s body with the tenant header, and the response is a Blob', () => {
    let result: Blob | undefined;
    events.eventsDownloadTaskLog({task: 't1', line_type: 'text'}, {
      headers: {'X-Cairnml-Tenant': 'company-1'}
    }).subscribe(blob => result = blob);

    const req = httpMock.expectOne(endpointUrl('events.download_task_log'));
    expect(req.request.method).toBe('POST');
    expect(req.request.urlWithParams).toBe(endpointUrl('events.download_task_log'));
    expect(req.request.body).toEqual({task: 't1', line_type: 'text'});
    expect(req.request.headers.get('X-Cairnml-Tenant')).toBe('company-1');
    expect(req.request.responseType).toBe('blob');
    const file = new Blob(['log']);
    req.flush(file);
    expect(result).toBe(file);
  });

  it('the task log sends no tenant header without a workspace', () => {
    events.eventsDownloadTaskLog({task: 't1', line_type: 'text'}).subscribe();

    const req = httpMock.expectOne(endpointUrl('events.download_task_log'));
    expect(req.request.headers.has('X-Cairnml-Tenant')).toBeFalse();
    req.flush(new Blob([]));
  });

  it('the task data is a POST of main\'s query and body with the tenant header, and the response is the data itself', () => {
    let result: unknown;
    reports.reportsGetTaskData({id: ['t1'], only_fields: ['name']}, {
      headers: {'X-Cairnml-Tenant': 'company-1'},
      params: {dark: ['1'], x: ['a', 'b']}
    }).subscribe(response => result = response);

    const req = httpMock.expectOne(`${endpointUrl('reports.get_task_data')}?dark=1&x=a&x=b`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({id: ['t1'], only_fields: ['name']});
    expect(req.request.headers.get('X-Cairnml-Tenant')).toBe('company-1');
    req.flush({data: {tasks: [{id: 't1'}]}});
    expect(result).toEqual({tasks: [{id: 't1'}]});
  });
});
