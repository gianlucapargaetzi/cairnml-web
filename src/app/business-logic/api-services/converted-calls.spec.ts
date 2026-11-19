import {TestBed} from '@angular/core/testing';
import {Store} from '@ngrx/store';
import {of} from 'rxjs';
import {HTTP} from '~/app.constants';
import {SmApiRequestsService} from './api-requests.service';
import {endpointUrl} from './endpoints';
import {ApiAccessService} from './access.service';
import {ApiDevicesService} from './devices.service';
import {ApiGitCredentialsService} from './git_credentials.service';
import {ApiGithubService} from './github.service';
import {ApiImportsService} from './imports.service';
import {ApiProjectsService} from './projects.service';
import {ApiQueuesService} from './queues.service';
import {ApiRepositoriesService} from './repositories.service';
import {ApiUserAccessService} from './user_access.service';
import {ApiWorkersService} from './workers.service';
import {BoardService} from '@common/project-board/board.service';
import {PlotDataService} from '@common/project-board/plot/plot-data.service';
import {GithubAppStatusService} from '@common/core/services/github-app-status.service';
import {ProjectShareService} from '@common/shared/project-dialog/project-settings/project-share.service';
import {RunImportApiService} from '~/features/run-import/run-import-api.service';

// The calls that were converted from endpointUrl(action) + a body literal to the generated service methods. Each one
// must send the same address (the one endpointUrl gives for the action, as on main) and the same body.
describe('calls converted to the generated service methods send main\'s address and body', () => {
  let post: jasmine.Spy;
  let previousBase: string;

  beforeEach(() => {
    previousBase = HTTP.API_BASE_URL;
    HTTP.API_BASE_URL = '/cairnml/api';
    post = jasmine.createSpy('post').and.returnValue(of({}));
    TestBed.configureTestingModule({providers: [
      {provide: SmApiRequestsService, useValue: {post}},
      {provide: Store, useValue: jasmine.createSpyObj('Store', ['dispatch', 'select'])},
    ]});
  });

  afterEach(() => {
    HTTP.API_BASE_URL = previousBase;
  });

  const lastCall = () => post.calls.mostRecent().args;

  const cases: [string, () => unknown, string, object][] = [
    // wrappers
    ['board load', () => TestBed.inject(BoardService).get('p1'), 'projects.get_overview_board', {project: 'p1'}],
    ['board save', () => TestBed.inject(BoardService).set('p1', {version: 3, cards: []}), 'projects.set_overview_board',
      {project: 'p1', version: 3, cards: []}],
    ['github status', () => TestBed.inject(GithubAppStatusService).status(), 'github.status', {}],
    ['project share removal', () => TestBed.inject(ProjectShareService).unshare('s1'), 'access.unshare', {share_id: 's1'}],
    ['plot parameters', () => TestBed.inject(PlotDataService).parameters('p1'), 'tasks.get_all_ex', {
      project: ['p1'], only_fields: ['hyperparams'], order_by: ['-created'], page: 0, page_size: 100, system_tags: ['-archived'],
    }],
    ['plot curves', () => TestBed.inject(PlotDataService).curves(['t1'], 'loss', 'value'),
      'events.multi_task_scalar_metrics_iter_histogram', {tasks: ['t1'], samples: 100, key: 'iter'}],
    ['plot metrics', () => TestBed.inject(PlotDataService).metrics('p1'), 'projects.get_unique_metric_variants', {project: 'p1'}],
    ['run import: prepare upload', () => TestBed.inject(RunImportApiService).prepareUpload('a.zip', 10, 'abc'),
      'imports.prepare_upload', {name: 'a.zip', size: 10, sha256: 'abc', content_type: 'application/zip'}],
    ['run import: prepare part', () => TestBed.inject(RunImportApiService).preparePart('i1', 2),
      'imports.prepare_part', {id: 'i1', part: 2}],
    ['run import: commit', () => TestBed.inject(RunImportApiService).commit('i1'), 'imports.commit', {id: 'i1'}],
    ['run import: commit with parts', () => TestBed.inject(RunImportApiService).commit('i1', [{number: 1, etag: 'e'}]),
      'imports.commit', {id: 'i1', parts: [{number: 1, etag: 'e'}]}],
    ['run import: run', () => TestBed.inject(RunImportApiService).run('i1'), 'imports.run', {id: 'i1'}],
    // generated methods called directly by components (same literal as on main)
    ['access share', () => TestBed.inject(ApiAccessService).accessShare({
      resource_type: 'queue', resource_id: 'q1', scope: 'projects', project: 'p1', level: 'read'}),
      'access.share', {resource_type: 'queue', resource_id: 'q1', scope: 'projects', project: 'p1', level: 'read'}],
    ['access list', () => TestBed.inject(ApiAccessService).accessList({resource_type: 'queue', resource_id: 'q1'}),
      'access.list', {resource_type: 'queue', resource_id: 'q1'}],
    ['dataset notices', () => TestBed.inject(ApiAccessService).accessNotices({}), 'access.notices', {}],
    ['dismiss notice', () => TestBed.inject(ApiAccessService).accessDismissNotice({id: 'n1'}), 'access.dismiss_notice', {id: 'n1'}],
    ['credentials list', () => TestBed.inject(ApiUserAccessService).user_accessGetAll({}), 'user_access.get_all', {}],
    ['credential check', () => TestBed.inject(ApiUserAccessService).user_accessCheck({id: 'c1'}), 'user_access.check', {id: 'c1'}],
    ['credential delete', () => TestBed.inject(ApiUserAccessService).user_accessDelete({id: 'c1'}), 'user_access.delete', {id: 'c1'}],
    ['add app credential', () => TestBed.inject(ApiUserAccessService).user_accessAddApp({
      label: 'l', app_id: 'a', api_url: 'u', key: 'k', scope: 'user'}),
      'user_access.add_app', {label: 'l', app_id: 'a', api_url: 'u', key: 'k', scope: 'user'}],
    ['git credential delete', () => TestBed.inject(ApiGitCredentialsService).git_credentialsDelete({host: 'h', path: 'p'}),
      'git_credentials.delete', {host: 'h', path: 'p'}],
    ['device reassign', () => TestBed.inject(ApiDevicesService).devicesReassign({id: 'd1', user: 'u1'}),
      'devices.reassign', {id: 'd1', user: 'u1'}],
    ['device revoke', () => TestBed.inject(ApiDevicesService).devicesRevoke({id: 'd1'}), 'devices.revoke', {id: 'd1'}],
    ['devices list', () => TestBed.inject(ApiDevicesService).devicesGetAll({}), 'devices.get_all', {}],
    ['project contributions', () => TestBed.inject(ApiProjectsService).projectsGetContributions({
      project: 'p1', period_days: 30, utc_offset_minutes: 0, limit: 5}),
      'projects.get_contributions', {project: 'p1', period_days: 30, utc_offset_minutes: 0, limit: 5}],
    ['agents: project queues', () => TestBed.inject(ApiProjectsService).projectsGetQueues({project: 'p1'}),
      'projects.get_queues', {project: 'p1'}],
    ['agents: waiting entries', () => TestBed.inject(ApiQueuesService).queuesGetAllEx({id: ['q1'], only_fields: ['id', 'entries']}),
      'queues.get_all_ex', {id: ['q1'], only_fields: ['id', 'entries']}],
    ['agents: workers', () => TestBed.inject(ApiWorkersService).workersGetAll({last_seen: 3600}), 'workers.get_all', {last_seen: 3600}],
    ['repository access: resolve', () => TestBed.inject(ApiRepositoriesService).repositoriesResolve({refs: ['a', 'b'], project: 'p'}),
      'repositories.resolve', {refs: ['a', 'b'], project: 'p'}],
    ['repository access: requirement', () => TestBed.inject(ApiRepositoriesService).repositoriesRequirement({tasks: ['t']}),
      'repositories.requirement', {tasks: ['t']}],
    ['repository details', () => TestBed.inject(ApiRepositoriesService).repositoriesGetDetails({ref: 'x'}),
      'repositories.get_details', {ref: 'x'}],
    ['repository list', () => TestBed.inject(ApiRepositoriesService).repositoriesGetAll({project: 'p1'}),
      'repositories.get_all', {project: 'p1'}],
    ['repository add', () => TestBed.inject(ApiRepositoriesService).repositoriesAdd({url: 'https://x/y', role: 'code'}),
      'repositories.add', {url: 'https://x/y', role: 'code'}],
    ['github status (component)', () => TestBed.inject(ApiGithubService).githubStatus({}), 'github.status', {}],
  ];

  for (const [name, invoke, action, body] of cases) {
    it(`${name} posts to ${action}`, () => {
      invoke();
      const [url, sent] = lastCall();
      expect(url).toBe(endpointUrl(action));
      expect(sent).toEqual(body);
    });
  }
});
