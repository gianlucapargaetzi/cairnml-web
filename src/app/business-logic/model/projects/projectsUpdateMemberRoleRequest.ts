/**
 * projects
 *
 * projects.update_member_role (API 2.37)
 */

import { ProjectMember } from './projectMember';

export interface ProjectsUpdateMemberRoleRequest {
    /**
     * Project id
     */
    project: string;
    /**
     * Id of the member whose role is changed
     */
    user: string;
    /**
     * New role of the member in the project
     */
    role: ProjectMember.RoleEnum;
}
