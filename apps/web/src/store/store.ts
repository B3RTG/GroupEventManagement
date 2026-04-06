import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import { authApi } from './api/authApi';
import { groupsApi } from './api/groupsApi';
import { eventsApi } from './api/eventsApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]:   authApi.reducer,
    [groupsApi.reducerPath]: groupsApi.reducer,
    [eventsApi.reducerPath]: eventsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(groupsApi.middleware)
      .concat(eventsApi.middleware),
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
