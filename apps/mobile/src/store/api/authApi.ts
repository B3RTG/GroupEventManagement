import { createApi } from '@reduxjs/toolkit/query/react';
import type { AuthResponse, User } from '@gem/api-client';
import { baseQueryWithReauth } from '../baseQuery';
import { setCredentials, logout } from '../authSlice';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (build) => ({
    loginWithGoogle: build.mutation<AuthResponse, { idToken: string }>({
      query: (body) => ({ url: '/auth/google', method: 'POST', body }),
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        const { data } = await queryFulfilled;
        dispatch(setCredentials(data));
      },
    }),

    loginWithApple: build.mutation<AuthResponse, { idToken: string }>({
      query: (body) => ({ url: '/auth/apple', method: 'POST', body }),
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        const { data } = await queryFulfilled;
        dispatch(setCredentials(data));
      },
    }),

    logoutSession: build.mutation<void, void>({
      query: () => ({ url: '/auth/session', method: 'DELETE' }),
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        await queryFulfilled.catch(() => {});
        dispatch(logout());
      },
    }),

    getMe: build.query<User, void>({
      query: () => '/auth/me',
    }),

    updatePushToken: build.mutation<void, { pushToken: string | null }>({
      query: (body) => ({ url: '/auth/me', method: 'PUT', body }),
    }),
  }),
});

export const {
  useLoginWithGoogleMutation,
  useLoginWithAppleMutation,
  useLogoutSessionMutation,
  useGetMeQuery,
  useUpdatePushTokenMutation,
} = authApi;
