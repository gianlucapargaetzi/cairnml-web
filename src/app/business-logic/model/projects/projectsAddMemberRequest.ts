/**
 * projects
 *
 * projects.add_member (API 2.37)
 */

import { ProjectMember } from './projectMember';

export interface ProjectsAddMemberRequest {
    /**
     * Project id
     */
    project: string;
    /**
     * Id of the user to add
     */
    user: string;
    /**
     * Role of the member in the project
     */
    role: ProjectMember.RoleEnum;
}
