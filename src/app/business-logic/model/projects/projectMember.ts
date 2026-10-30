/**
 * projects
 *
 * A member of a project, as returned by projects.get_members (API 2.37).
 */

export interface ProjectMember {
    /**
     * Member user id
     */
    user?: string;
    /**
     * Member role
     */
    role?: ProjectMember.RoleEnum;
    /**
     * Time the member was added
     */
    added?: string;
    /**
     * Id of the user who added the member
     */
    added_by?: string;
}
export namespace ProjectMember {
    export type RoleEnum = 'collaborator' | 'read_write' | 'read';
    export const RoleEnum = {
        Collaborator: 'collaborator' as RoleEnum,
        ReadWrite: 'read_write' as RoleEnum,
        Read: 'read' as RoleEnum
    };
}
