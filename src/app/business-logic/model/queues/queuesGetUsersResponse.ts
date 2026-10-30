/**
 * queues
 *
 * Users granted access to a queue.
 */

import {QueuesQueueUser} from './queuesQueueUser';

export interface QueuesGetUsersResponse {
    /**
     * Users granted access to the queue
     */
    users?: Array<QueuesQueueUser>;
}
