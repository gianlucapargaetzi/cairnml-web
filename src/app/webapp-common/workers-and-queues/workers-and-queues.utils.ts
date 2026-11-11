import {Queue} from '@common/workers-and-queues/actions/queues.actions';
import {get, orderBy} from 'lodash-es';
import {WorkerExt} from '@common/workers-and-queues/actions/workers.actions';
import {AGENT_OFFLINE_AFTER_MS} from './workers-and-queues.consts';
import {SortMeta} from 'primeng/api';
import {Queue as BLQ} from '~/business-logic/model/queues/queue';

export const sortTable = <T>(sortFields: SortMeta[], entities: T[]): T[] => {
  const srtByFields = sortFields.map(f => entry => {
      const val = get(entry, f.field);
      return typeof val === 'string' ? val.toLowerCase() : val;
    }
  );
  const srtByOrders = sortFields.map(f => f.order > 0 ? 'asc': 'desc');
  return orderBy<T>(entities, srtByFields, srtByOrders);
};

export const isAgentOnline = (lastReport: string | undefined, now = Date.now()): boolean => {
  if (!lastReport) {
    return false;
  }
  const time = new Date(lastReport).getTime();
  return !isNaN(time) && now - time < AGENT_OFFLINE_AFTER_MS;
};

export const transformAndSortWorkers = (sortFields, workers: WorkerExt[]): WorkerExt[] => sortTable<WorkerExt>(sortFields, workers.map(worker => {
  // an agent that never sent a status report is seen when it last registered or was active
  const lastSeen = worker.last_report_time ?? worker.last_activity_time;
  return {
    ...worker,
    originalName: worker.originalName || worker.id,
    name: worker.originalName || worker.id,
    last_seen: lastSeen,
    online: isAgentOnline(lastSeen)
  };
}));

// The caption is the real name of the queue: the one an agent is started with and a run is queued to
// (an agent's queue is its machine name plus a short suffix). The display name is in the tooltip of the name.
export const calculateQueuesCaption = (queues: BLQ[]) =>
  queues.map(queue => ({...queue, caption: queue.name} as Queue));
