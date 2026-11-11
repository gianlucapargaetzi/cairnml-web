import {Queue as BLQ} from '~/business-logic/model/queues/queue';
import {calculateQueuesCaption} from './workers-and-queues.utils';

describe('calculateQueuesCaption', () => {
  it('captions a queue with its real name, not its display name', () => {
    // an agent's queue: the real name has a suffix, the display name is the bare machine name
    const [queue] = calculateQueuesCaption([{id: 'parg-nb-b59488', name: 'parg-nb-b59488', display_name: 'parg-nb'} as BLQ]);
    expect(queue.caption).toBe('parg-nb-b59488');
  });

  it('captions a queue without a display name with its name', () => {
    const [queue] = calculateQueuesCaption([{id: 'q1', name: 'default'} as BLQ]);
    expect(queue.caption).toBe('default');
  });
});
