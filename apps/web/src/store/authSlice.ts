import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@gem/api-client';
import type { RootState } from './store';

const STORAGE_KEY = 'gem_auth';

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  /** Unix timestamp (ms) when accessToken expires */
  expiresAt: number | null;
  user: User | null;
}

interface Credentials {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  user: User;
}

function loadFromStorage(): Partial<AuthState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<AuthState>;
  } catch {
    return {};
  }
}

function saveToStorage(state: AuthState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage not available
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage not available
  }
}

const persisted = loadFromStorage();

const initialState: AuthState = {
  accessToken: persisted.accessToken ?? null,
  refreshToken: persisted.refreshToken ?? null,
  expiresAt:    persisted.expiresAt    ?? null,
  user:         persisted.user         ?? null,
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
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

// ── Selectors ────────────────────────────────────────────
export const selectAccessToken  = (s: RootState) => s.auth.accessToken;
export const selectRefreshToken = (s: RootState) => s.auth.refreshToken;
export const selectUser         = (s: RootState) => s.auth.user;
export const selectIsLoggedIn   = (s: RootState) =>
  s.auth.accessToken !== null &&
  s.auth.expiresAt !== null &&
  s.auth.expiresAt > Date.now();
