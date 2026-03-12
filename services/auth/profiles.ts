import * as SecureStore from 'expo-secure-store';
import { storage } from '@/lib/storage';

const PROFILES_KEY = 'saved_profiles';
const ACTIVE_PROFILE_KEY = 'active_profile_id';
const PROFILE_KEY_PREFIX = 'profile_key_';

export interface ProfileMetadata {
  id: string;
  name: string;
  email: string | null;
  serverUrl: string;
  lastProjectRef: string | null;
  createdAt: string;
}

export interface Profile extends ProfileMetadata {
  apiKey: string;
}

function generateId(): string {
  return `prof_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getProfilesList(): ProfileMetadata[] {
  const json = storage.getString(PROFILES_KEY);
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    // Handle migration from old format (lastEnvironment → lastProjectRef)
    return parsed.map((p: Record<string, unknown>) => ({
      id: p.id as string,
      name: p.name as string,
      email: (p.email as string | null) ?? null,
      serverUrl: p.serverUrl as string,
      lastProjectRef: (p.lastProjectRef as string | null) ?? null,
      createdAt: p.createdAt as string,
    }));
  } catch {
    return [];
  }
}

function saveProfilesList(profiles: ProfileMetadata[]): void {
  storage.set(PROFILES_KEY, JSON.stringify(profiles));
}

export function getProfiles(): ProfileMetadata[] {
  return getProfilesList();
}

export function getActiveProfileId(): string | null {
  return storage.getString(ACTIVE_PROFILE_KEY) ?? null;
}

export function setActiveProfileId(id: string | null): void {
  if (id) {
    storage.set(ACTIVE_PROFILE_KEY, id);
  } else {
    storage.remove(ACTIVE_PROFILE_KEY);
  }
}

export async function getProfileApiKey(id: string): Promise<string | null> {
  return SecureStore.getItemAsync(`${PROFILE_KEY_PREFIX}${id}`);
}

export async function saveProfile(profile: Omit<Profile, 'id' | 'createdAt'>): Promise<ProfileMetadata> {
  const id = generateId();
  const metadata: ProfileMetadata = {
    id,
    name: profile.name,
    email: profile.email ?? null,
    serverUrl: profile.serverUrl,
    lastProjectRef: profile.lastProjectRef,
    createdAt: new Date().toISOString(),
  };

  await SecureStore.setItemAsync(`${PROFILE_KEY_PREFIX}${id}`, profile.apiKey);

  const profiles = getProfilesList();
  profiles.push(metadata);
  saveProfilesList(profiles);

  return metadata;
}

export function updateProfile(id: string, updates: Partial<Pick<ProfileMetadata, 'name' | 'email' | 'serverUrl' | 'lastProjectRef'>>): ProfileMetadata | null {
  const profiles = getProfilesList();
  const index = profiles.findIndex((p) => p.id === id);
  if (index === -1) return null;

  profiles[index] = { ...profiles[index], ...updates };
  saveProfilesList(profiles);
  return profiles[index];
}

export async function deleteProfile(id: string): Promise<void> {
  await SecureStore.deleteItemAsync(`${PROFILE_KEY_PREFIX}${id}`);
  const profiles = getProfilesList().filter((p) => p.id !== id);
  saveProfilesList(profiles);

  if (getActiveProfileId() === id) {
    setActiveProfileId(null);
  }
}

export function maskApiKey(key: string): string {
  if (key.length <= 10) return key;
  const prefix = key.slice(0, 7);
  const suffix = key.slice(-3);
  return `${prefix}****${suffix}`;
}
