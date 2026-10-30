/**
 * queues
 *
 * A user granted access to a queue.
 */

export interface QueuesQueueUser {
    /**
     * User id
     */
    user?: string;
    /**
     * Time the user was granted access
     */
    added?: string;
    /**
     * Id of the admin who granted access
     */
    added_by?: string;
}
