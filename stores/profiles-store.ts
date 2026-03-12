import { create } from 'zustand';
import {
  getProfiles,
  getActiveProfileId,
  setActiveProfileId,
  getProfileApiKey,
  saveProfile,
  updateProfile,
  deleteProfile,
  type ProfileMetadata,
} from '@/services/auth/profiles';
import { useAuthStore } from './auth-store';
import { Sentry } from '@/services/sentry';
import { posthogCapture } from '@/services/posthog';
import { API_BASE_URL } from '@/lib/constants';

interface ProfilesState {
  profiles: ProfileMetadata[];
  activeProfileId: string | null;

  loadProfiles: () => void;
  setActiveProfile: (id: string) => Promise<void>;
  addProfile: (profile: { name: string; apiKey: string; serverUrl: string; lastProjectRef: string | null; email: string | null }) => Promise<ProfileMetadata>;
  renameProfile: (id: string, name: string) => void;
  removeProfile: (id: string) => Promise<void>;
  updateLastProject: (id: string, projectRef: string | null) => void;
  updateEmail: (id: string, email: string) => void;
}

export const useProfilesStore = create<ProfilesState>((set, get) => ({
  profiles: [],
  activeProfileId: null,

  loadProfiles: () => {
    const profiles = getProfiles();
    const activeProfileId = getActiveProfileId();
    set({ profiles, activeProfileId });
  },

  setActiveProfile: async (id) => {
    const profiles = get().profiles;
    const profile = profiles.find((p) => p.id === id);
    if (!profile) return;
    Sentry.logger.info(Sentry.logger.fmt`Switching to profile ${profile.name}`);
    posthogCapture('profile switched', { profile_name: profile.name });

    const apiKey = await getProfileApiKey(id);
    if (!apiKey) return;

    setActiveProfileId(id);
    set({ activeProfileId: id });

    await useAuthStore.getState().setCredentials(
      apiKey,
      profile.serverUrl || undefined,
      profile.lastProjectRef ?? undefined,
    );
  },

  addProfile: async (data) => {
    const metadata = await saveProfile(data);
    set((state) => ({ profiles: [...state.profiles, metadata] }));
    posthogCapture('profile created', { has_custom_server: data.serverUrl !== API_BASE_URL });
    return metadata;
  },

  renameProfile: (id, name) => {
    const updated = updateProfile(id, { name });
    if (!updated) return;
    set((state) => ({
      profiles: state.profiles.map((p) => (p.id === id ? updated : p)),
    }));
    posthogCapture('profile renamed');
  },

  removeProfile: async (id) => {
    const wasActive = get().activeProfileId === id;
    Sentry.logger.info(Sentry.logger.fmt`Deleting profile ${id}`);
    posthogCapture('profile deleted', { was_active: wasActive });
    await deleteProfile(id);
    set((state) => ({
      profiles: state.profiles.filter((p) => p.id !== id),
      activeProfileId: wasActive ? null : state.activeProfileId,
    }));
    if (wasActive) {
      await useAuthStore.getState().clearCredentials();
    }
  },

  updateLastProject: (id, projectRef) => {
    const updated = updateProfile(id, { lastProjectRef: projectRef });
    if (!updated) return;
    set((state) => ({
      profiles: state.profiles.map((p) => (p.id === id ? updated : p)),
    }));
  },

  updateEmail: (id, email) => {
    const updated = updateProfile(id, { email });
    if (!updated) return;
    set((state) => ({
      profiles: state.profiles.map((p) => (p.id === id ? updated : p)),
    }));
  },
}));
