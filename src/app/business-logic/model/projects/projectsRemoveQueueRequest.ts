/**
 * queues
 *
 * Request to remove a queue allocation from a project.
 */

export interface ProjectsRemoveQueueRequest {
    /**
     * Project id
     */
    project: string;
    /**
     * Queue id
     */
    queue: string;
}
