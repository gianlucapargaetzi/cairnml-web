/**
 * projects
 *
 * projects.get_members (API 2.37)
 */

import { ProjectMember } from './projectMember';

export interface ProjectsGetMembersResponse {
    /**
     * Id of the project owner
     */
    owner?: string;
    /**
     * Project members
     */
    members?: Array<ProjectMember>;
}
