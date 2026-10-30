/**
 * queues
 *
 * Queues allocated to a project.
 */

import {ProjectsQueueSummary} from './projectsQueueSummary';

export interface ProjectsGetQueuesResponse {
    /**
     * Queues allocated to the project
     */
    queues?: Array<ProjectsQueueSummary>;
}
