/**
 * queues
 *
 * Request to grant or remove a user's access to a queue.
 */

export interface QueuesUserRequest {
    /**
     * Queue id
     */
    queue: string;
    /**
     * User id
     */
    user: string;
}
