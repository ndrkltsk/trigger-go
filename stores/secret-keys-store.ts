import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { ALL_CANDIDATE_ENVIRONMENTS, type Environment } from './preferences-store';

function storeKey(env: Environment): string {
  return `trigger_secret_${env}`;
}

interface SecretKeysState {
  keys: Record<Environment, string | null>;
  isLoaded: boolean;
  setSecretKey: (env: Environment, key: string) => Promise<void>;
  removeSecretKey: (env: Environment) => Promise<void>;
  clearAllSecretKeys: () => Promise<void>;
  loadSecretKeys: () => Promise<void>;
}

const INITIAL_KEYS: Record<Environment, string | null> = {
  dev: null,
  staging: null,
  prod: null,
  preview: null,
};

export const useSecretKeysStore = create<SecretKeysState>((set, get) => ({
  keys: { ...INITIAL_KEYS },
  isLoaded: false,

  setSecretKey: async (env, key) => {
    await SecureStore.setItemAsync(storeKey(env), key);
    set((state) => ({
      keys: { ...state.keys, [env]: key },
    }));
  },

  removeSecretKey: async (env) => {
    await SecureStore.deleteItemAsync(storeKey(env));
    set((state) => ({
      keys: { ...state.keys, [env]: null },
    }));
  },

  clearAllSecretKeys: async () => {
    await Promise.all(
      ALL_CANDIDATE_ENVIRONMENTS.map((env) => SecureStore.deleteItemAsync(storeKey(env)))
    );
    set({ keys: { ...INITIAL_KEYS } });
  },

  loadSecretKeys: async () => {
    const results = await Promise.all(
      ALL_CANDIDATE_ENVIRONMENTS.map((env) => SecureStore.getItemAsync(storeKey(env)))
    );
    const keys = { ...INITIAL_KEYS };
    ALL_CANDIDATE_ENVIRONMENTS.forEach((env, i) => {
      keys[env] = results[i] ?? null;
    });
    set({ keys, isLoaded: true });
  },
}));

export function getSecretKeyForEnv(env: Environment): string | null {
  return useSecretKeysStore.getState().keys[env];
}
