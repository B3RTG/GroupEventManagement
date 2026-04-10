import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@gem/api-client';
import type { RootState } from './store';

const STORAGE_KEY = 'gem_auth';

export interface AuthState {
  accessToken:  string | null;
  refreshToken: string | null;
  /** Unix timestamp (ms) when accessToken expires */
  expiresAt:    number | null;
  user:         User | null;
}

interface Credentials {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number; // seconds
  user:         User;
}

// ── Persistence helpers (fire-and-forget) ────────────────
function saveToStorage(state: AuthState) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
}

function clearStorage() {
  AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
}

// ── Async thunk: load persisted auth on app startup ──────
export const initAuth = createAsyncThunk('auth/init', async (_, { dispatch }) => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<AuthState>;
    if (parsed.accessToken && parsed.user && parsed.expiresAt !== undefined && parsed.refreshToken !== undefined) {
      dispatch(hydrateAuth(parsed as AuthState));
    }
  } catch {
    // ignore corrupt storage
  }
});

// ── Initial state ────────────────────────────────────────
const initialState: AuthState = {
  accessToken:  null,
  refreshToken: null,
  expiresAt:    null,
  user:         null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<Credentials>) {
      const { accessToken, refreshToken, expiresIn, user } = action.payload;
      state.accessToken  = accessToken;
      state.refreshToken = refreshToken;
      state.expiresAt    = Date.now() + expiresIn * 1000;
      state.user         = user;
      saveToStorage(state as AuthState);
    },
    logout(state) {
      state.accessToken  = null;
      state.refreshToken = null;
      state.expiresAt    = null;
      state.user         = null;
      clearStorage();
    },
    /** Internal — hydrate from AsyncStorage on startup */
    hydrateAuth(state, action: PayloadAction<AuthState>) {
      state.accessToken  = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.expiresAt    = action.payload.expiresAt;
      state.user         = action.payload.user;
    },
  },
});

export const { setCredentials, logout, hydrateAuth } = authSlice.actions;
export default authSlice.reducer;

// ── Selectors ─────────────────────────────────────────────
export const selectAccessToken  = (s: RootState) => s.auth.accessToken;
export const selectRefreshToken = (s: RootState) => s.auth.refreshToken;
export const selectUser         = (s: RootState) => s.auth.user;
export const selectIsLoggedIn   = (s: RootState) =>
  s.auth.accessToken !== null &&
  s.auth.expiresAt !== null &&
  s.auth.expiresAt > Date.now();
