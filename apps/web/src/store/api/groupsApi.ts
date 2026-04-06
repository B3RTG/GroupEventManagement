import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  Group,
  GroupMember,
  UUID,
} from '@gem/api-client';
import type { CreateGroupInput, JoinGroupInput, UpdateMemberRoleInput } from '@gem/validators';
import { baseQueryWithReauth } from '../baseQuery';

export const groupsApi = createApi({
  reducerPath: 'groupsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Group', 'Member'],
  endpoints: (build) => ({
    getMyGroups: build.query<Group[], void>({
      query: () => '/groups',
      providesTags: ['Group'],
    }),

    getGroup: build.query<Group, UUID>({
      query: (id) => `/groups/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Group', id }],
    }),

    createGroup: build.mutation<Group, CreateGroupInput>({
      query: (body) => ({ url: '/groups', method: 'POST', body }),
      invalidatesTags: ['Group'],
    }),

    joinGroup: build.mutation<Group, JoinGroupInput>({
      query: (body) => ({ url: '/groups/join', method: 'POST', body }),
      invalidatesTags: ['Group'],
    }),

    getMembers: build.query<GroupMember[], UUID>({
      query: (groupId) => `/groups/${groupId}/members`,
      providesTags: (_r, _e, groupId) => [{ type: 'Member', id: groupId }],
    }),

    changeMemberRole: build.mutation<
      void,
      { groupId: UUID; userId: UUID } & UpdateMemberRoleInput
    >({
      query: ({ groupId, userId, role }) => ({
        url: `/groups/${groupId}/members/${userId}/role`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: (_r, _e, { groupId }) => [{ type: 'Member', id: groupId }],
    }),

    removeMember: build.mutation<void, { groupId: UUID; userId: UUID }>({
      query: ({ groupId, userId }) => ({
        url: `/groups/${groupId}/members/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { groupId }) => [{ type: 'Member', id: groupId }],
    }),

    regenerateInviteCode: build.mutation<{ code: string }, UUID>({
      query: (groupId) => ({
        url: `/groups/${groupId}/invite-code/regenerate`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, groupId) => [{ type: 'Group', id: groupId }],
    }),
  }),
});

export const {
  useGetMyGroupsQuery,
  useGetGroupQuery,
  useCreateGroupMutation,
  useJoinGroupMutation,
  useGetMembersQuery,
  useChangeMemberRoleMutation,
  useRemoveMemberMutation,
  useRegenerateInviteCodeMutation,
} = groupsApi;
