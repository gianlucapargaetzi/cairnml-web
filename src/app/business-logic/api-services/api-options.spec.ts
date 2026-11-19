import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {HTTP} from '../../app.constants';
import {ApiEventsService} from './events.service';
import {ApiOrganizationService} from './organization.service';
import {ApiReportsService} from './reports.service';

/**
 * The options a generated call takes (its headers, the query), and the calls that are not JSON: a Blob (a file) and a
 * GET. The requests are checked on the HTTP layer, against the address the schema gives each action.
 */
describe('generated service calls with options', () => {
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

  it('sends the query and the headers of the options with a JSON POST and its body', () => {
    let result: any;
    reports.reportsGetTaskData({id: ['t1']}, {
      headers: {'X-Cairnml-Tenant': 'company-1'},
      params: {'only': 'x'}
    }).subscribe(response => result = response);

    const req = httpMock.expectOne(`${HTTP.API_BASE_URL}/v2.41/reports.get_task_data?only=x`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({id: ['t1']});
    expect(req.request.headers.get('X-Cairnml-Tenant')).toBe('company-1');
    expect(req.request.headers.get('Accept')).toBe('application/json');
    req.flush({data: {tasks: []}});
    expect(result).toEqual({tasks: []});
  });

  it('sends a JSON call without options as before: no query, the JSON header only', () => {
    events.eventsGetTaskLog({task: 't1'}).subscribe();

    const req = httpMock.expectOne(`${HTTP.API_BASE_URL}/v2.30/events.get_task_log`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.has('X-Cairnml-Tenant')).toBeFalse();
    expect(req.request.headers.get('Accept')).toBe('application/json');
    req.flush({data: {}});
  });

  it('returns the log attachment as a Blob, posted with the request and the tenant header', () => {
    let result: Blob | undefined;
    events.eventsDownloadTaskLog({task: 't1', line_type: 'text'}, {
      headers: {'X-Cairnml-Tenant': 'company-1'}
    }).subscribe(blob => result = blob);

    const req = httpMock.expectOne(`${HTTP.API_BASE_URL}/v2.1/events.download_task_log`);
    expect(req.request.method).toBe('POST');
    expect(req.request.responseType).toBe('blob');
    expect(req.request.body).toEqual({task: 't1', line_type: 'text'});
    expect(req.request.headers.get('X-Cairnml-Tenant')).toBe('company-1');
    expect(req.request.headers.has('Accept')).toBeFalse();
    req.flush(new Blob(['log line']));
    expect(result instanceof Blob).toBeTrue();
  });

  it('downloads the file by GET with the request as the query, and builds the same address for a link', () => {
    let result: Blob | undefined;
    organization.organizationDownloadForGetAll({prepare_id: 'p 1'}, {
      headers: {'X-Cairnml-Tenant': 'company-1'}
    }).subscribe(blob => result = blob);

    const address = `${HTTP.API_BASE_URL}/v2.26/organization.download_for_get_all?prepare_id=p%201`;
    const req = httpMock.expectOne(address);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    expect(req.request.headers.get('X-Cairnml-Tenant')).toBe('company-1');
    req.flush(new Blob(['csv']));
    expect(result instanceof Blob).toBeTrue();

    expect(organization.organizationDownloadForGetAllUrl({prepare_id: 'p 1'})).toBe(address);
  });
});
