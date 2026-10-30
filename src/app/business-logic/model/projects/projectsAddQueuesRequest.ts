/**
 * queues
 *
 * Request to allocate queues to a project.
 */

export interface ProjectsAddQueuesRequest {
    /**
     * Project id
     */
    project: string;
    /**
     * Ids of the queues to allocate
     */
    queues: Array<string>;
}
