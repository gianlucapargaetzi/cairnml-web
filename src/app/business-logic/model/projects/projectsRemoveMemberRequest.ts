/**
 * projects
 *
 * projects.remove_member (API 2.37)
 */

export interface ProjectsRemoveMemberRequest {
    /**
     * Project id
     */
    project: string;
    /**
     * Id of the member to remove
     */
    user: string;
}
