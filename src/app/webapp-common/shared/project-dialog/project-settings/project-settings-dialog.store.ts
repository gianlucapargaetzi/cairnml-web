import {patchState, signalStoreFeature, withComputed, withMethods, withState} from '@ngrx/signals';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {computed, inject} from '@angular/core';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {ApiUsersService} from '~/business-logic/api-services/users.service';
import {Store} from '@ngrx/store';
import {selectCurrentUser} from '@common/core/reducers/users-reducer';
import {forkJoin, lastValueFrom, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {sortByField} from '@common/tasks/tasks.utils';
import {environment} from '../../../../../environments/environment';
import {ProjectMember} from '~/business-logic/model/projects/projectMember';

export interface CompanyUser {
  id: string;
  name: string;
}

export interface MemberRow {
  user: string;
  name: string;
  role: ProjectMember.RoleEnum | 'owner';
  added?: string;
  isOwner: boolean;
}

interface ProjectSettingsState {
  scalars: MetricVariantResult[];
  projectId: string;
  readOnly: boolean;
  members: ProjectMember[];
  owner: string;
  companyUsers: CompanyUser[];
  membersLoading: boolean;
}

const initialState: ProjectSettingsState = {
  scalars: [],
  projectId: null,
  readOnly: false,
  members: [],
  owner: null,
  companyUsers: [],
  membersLoading: false,
};

export const withProjectSettingsStore = signalStoreFeature(
  environment.storeDevToolsFeature('project-settings'),
  withState(initialState),
  withComputed((store) => {
    const ngrxStore = inject(Store);
    const currentUser = ngrxStore.selectSignal(selectCurrentUser);

    const userNameOf = computed(() => {
      const names = new Map<string, string>(store.companyUsers().map(user => [user.id, user.name]));
      return (id: string): string => names.get(id) ?? id;
    });

    // The owner first, then the members. The owner's row has no controls: ownership is not changed here.
    const rows = computed<MemberRow[]>(() => {
      const nameOf = userNameOf();
      const owner = store.owner();
      const ownerRow: MemberRow[] = owner ? [{user: owner, name: nameOf(owner), role: 'owner', isOwner: true}] : [];
      return [
        ...ownerRow,
        ...store.members().map(member => ({
          user: member.user,
          name: nameOf(member.user),
          role: member.role,
          added: member.added,
          isOwner: false,
        })),
      ];
    });

    // Same rule as the server (project access): a company admin, the owner, or a member with the collaborator role.
    const canManage = computed(() => {
      const user = currentUser();
      if (!user) {
        return false;
      }
      if (user.role === 'admin' || user.id === store.owner()) {
        return true;
      }
      return store.members().some(member => member.user === user.id && member.role === ProjectMember.RoleEnum.Collaborator);
    });

    // Company users who are not already the owner or a member, for the add-user form.
    const availableUsers = computed(() => {
      const memberIds = new Set([store.owner(), ...store.members().map(member => member.user)]);
      return store.companyUsers().filter(user => !memberIds.has(user.id));
    });

    // Only the owner changes the queue allocations of the project, even an admin
    const isOwner = computed(() => !!currentUser() && currentUser().id === store.owner());

    return {
      isReadOnly: computed(() => store.readOnly()),
      isOwner,
      canManageMembers: canManage,
      availableUsers,
      memberRows: rows,
    };
  }),
  withMethods((store, projectsApi = inject(ApiProjectsService), usersApi = inject(ApiUsersService)) => {
    const loadMembers = async () => {
      patchState(store, {membersLoading: true});
      try {
        const res = await lastValueFrom(projectsApi.projectsGetMembers({project: store.projectId()}));
        patchState(store, {owner: res.owner, members: res.members ?? []});
      } finally {
        patchState(store, {membersLoading: false});
      }
    };

    return {
      async loadScalars() {
        const experimentsMetrics: Observable<MetricVariantResult[]> = projectsApi.projectsGetUniqueMetricVariants({
          project: store.projectId() === '*' ? null : store.projectId(),
          include_subprojects: false
        }).pipe(map(res => res.metrics))
        const modelsMetrics: Observable<MetricVariantResult[]> = projectsApi.projectsGetUniqueMetricVariants({
          project: store.projectId() === '*' ? null : store.projectId(),
          include_subprojects: false,
          model_metrics: true
        }).pipe(map(res => res.metrics))
        const scalars = await lastValueFrom(forkJoin([experimentsMetrics, modelsMetrics]));
        // const scalars = toSignal(experimentsMetrics);
        patchState(store, { scalars: sortByField(scalars?.flat(), 'metric') || [] });
      },

      setProject(projectId: string): void {
        patchState(store, () => ({ projectId: projectId }));
      },

      loadMembers,

      async loadCompanyUsers() {
        const res = await lastValueFrom(usersApi.usersGetAllEx({only_fields: ['id', 'name']}));
        patchState(store, {companyUsers: sortByField(res.users ?? [], 'name')});
      },

      async addMember(user: string, role: ProjectMember.RoleEnum) {
        await lastValueFrom(projectsApi.projectsAddMember({project: store.projectId(), user, role}));
        await loadMembers();
      },

      async updateMemberRole(user: string, role: ProjectMember.RoleEnum) {
        await lastValueFrom(projectsApi.projectsUpdateMemberRole({project: store.projectId(), user, role}));
        await loadMembers();
      },

      async removeMember(user: string) {
        await lastValueFrom(projectsApi.projectsRemoveMember({project: store.projectId(), user}));
        await loadMembers();
      },
    };
  })
);
