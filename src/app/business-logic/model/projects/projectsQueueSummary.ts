/**
 * queues
 *
 * A queue, as listed for a project.
 */

export interface ProjectsQueueSummary {
    /**
     * Queue id
     */
    id?: string;
    /**
     * Queue name
     */
    name?: string;
    /**
     * Whether the queue is public
     */
    public?: boolean;
}
