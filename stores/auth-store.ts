import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Sentry } from '@/services/sentry';
import { posthogCapture, posthogRegister } from '@/services/posthog';
import { API_BASE_URL } from '@/lib/constants';

const TOKEN_KEY = 'trigger_api_token';
const BASE_URL_KEY = 'trigger_base_url';
const PROJECT_REF_KEY = 'trigger_project_ref';

interface AuthState {
  token: string | null;
  baseUrl: string;
  projectRef: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setCredentials: (token: string, baseUrl?: string, projectRef?: string) => Promise<void>;
  clearCredentials: () => Promise<void>;
  loadCredentials: () => Promise<void>;
  switchProject: (projectRef: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  baseUrl: API_BASE_URL,
  projectRef: null,
  isAuthenticated: false,
  isLoading: true,

  setCredentials: async (token, baseUrl, projectRef) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    if (baseUrl) {
      await SecureStore.setItemAsync(BASE_URL_KEY, baseUrl);
    }
    if (projectRef) {
      await SecureStore.setItemAsync(PROJECT_REF_KEY, projectRef);
    }

    set({
      token,
      baseUrl: baseUrl ?? get().baseUrl,
      projectRef: projectRef ?? get().projectRef,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  clearCredentials: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(BASE_URL_KEY);
    await SecureStore.deleteItemAsync(PROJECT_REF_KEY);

    set({
      token: null,
      baseUrl: API_BASE_URL,
      projectRef: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  switchProject: async (projectRef) => {
    Sentry.logger.info(Sentry.logger.fmt`Switching to project ${projectRef}`);
    posthogCapture('project switched', { project_ref: projectRef });
    posthogRegister({ project_ref: projectRef });
    await SecureStore.setItemAsync(PROJECT_REF_KEY, projectRef);
    set({ projectRef });
  },

  loadCredentials: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const baseUrl = await SecureStore.getItemAsync(BASE_URL_KEY);
      const projectRef = await SecureStore.getItemAsync(PROJECT_REF_KEY);

      if (token) {
        set({
          token,
          baseUrl: baseUrl ?? API_BASE_URL,
          projectRef,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));

export function getAuthToken(): string | null {
  return useAuthStore.getState().token;
}

export function getBaseUrl(): string {
  return useAuthStore.getState().baseUrl;
}
