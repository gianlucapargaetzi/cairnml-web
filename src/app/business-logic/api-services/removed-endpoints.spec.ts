import {ApiPipelinesService} from './pipelines.service';
import {ApiQueuesService} from './queues.service';
import {ApiReportsService} from './reports.service';
import {ApiStorageService} from './storage.service';
import {ApiTasksService} from './tasks.service';

// The server does not define these actions. The web app must not have a method that calls them.
describe('API services without the actions the server lacks', () => {
  const hasMethod = (service: object, name: string) => typeof (service as Record<string, unknown>)[name] === 'function';

  it('has no queues.get_by_task_id call', () => {
    expect(hasMethod(ApiQueuesService.prototype, 'queuesGetByTaskId')).toBeFalse();
  });

  it('has no pipelines.check_new_run call', () => {
    expect(hasMethod(ApiPipelinesService.prototype, 'pipelinesCheckNewRun')).toBeFalse();
  });

  it('has no reports.share call', () => {
    expect(hasMethod(ApiReportsService.prototype, 'reportsShare')).toBeFalse();
  });

  it('has no tasks.get_operations_log call', () => {
    expect(hasMethod(ApiTasksService.prototype, 'tasksGetOperationsLog')).toBeFalse();
  });

  it('has no storage settings calls', () => {
    for (const name of ['storageGetSettings', 'storageSetSettings', 'storageResetSettings']) {
      expect(hasMethod(ApiStorageService.prototype, name)).toBeFalse();
    }
  });
});
