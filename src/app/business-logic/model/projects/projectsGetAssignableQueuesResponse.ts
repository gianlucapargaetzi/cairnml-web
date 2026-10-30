/**
 * queues
 *
 * Queues the project owner may allocate.
 */

import {ProjectsQueueSummary} from './projectsQueueSummary';

export interface ProjectsGetAssignableQueuesResponse {
    /**
     * Queues the owner may allocate
     */
    queues?: Array<ProjectsQueueSummary>;
}
