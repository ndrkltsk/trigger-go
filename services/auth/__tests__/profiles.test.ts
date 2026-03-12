import {
  getProfiles,
  saveProfile,
  updateProfile,
  deleteProfile,
  maskApiKey,
  getActiveProfileId,
  setActiveProfileId,
  getProfileApiKey,
} from '@/services/auth/profiles';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const SecureStore = require('expo-secure-store');

// Mock MMKV storage
const mockStore: Record<string, string> = {};
jest.mock('@/lib/storage', () => ({
  storage: {
    getString: (key: string) => mockStore[key] ?? undefined,
    set: (key: string, value: string) => { mockStore[key] = value; },
    remove: (key: string) => { delete mockStore[key]; },
  },
}));

beforeEach(() => {
  Object.keys(mockStore).forEach((k) => delete mockStore[k]);
  jest.clearAllMocks();
});

describe('maskApiKey', () => {
  it('masks a typical API key', () => {
    expect(maskApiKey('tr_pat_abc123xyz')).toBe('tr_pat_****xyz');
  });

  it('returns short keys as-is', () => {
    expect(maskApiKey('short')).toBe('short');
  });
});

describe('profile CRUD', () => {
  it('starts with no profiles', () => {
    expect(getProfiles()).toEqual([]);
  });

  it('saves a profile', async () => {
    const metadata = await saveProfile({
      name: 'My Project',
      apiKey: 'tr_pat_key123',
      serverUrl: 'https://api.trigger.dev',
      lastProjectRef: null,
      email: null,
    });

    expect(metadata.name).toBe('My Project');
    expect(metadata.id).toMatch(/^prof_/);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      expect.stringContaining('profile_key_'),
      'tr_pat_key123'
    );

    const profiles = getProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe('My Project');
  });

  it('updates a profile name', async () => {
    const metadata = await saveProfile({
      name: 'Original',
      apiKey: 'tr_pat_key456',
      serverUrl: 'https://api.trigger.dev',
      lastProjectRef: null,
      email: null,
    });

    const updated = updateProfile(metadata.id, { name: 'Renamed' });
    expect(updated?.name).toBe('Renamed');

    const profiles = getProfiles();
    expect(profiles[0].name).toBe('Renamed');
  });

  it('deletes a profile', async () => {
    const metadata = await saveProfile({
      name: 'To Delete',
      apiKey: 'tr_pat_key789',
      serverUrl: 'https://api.trigger.dev',
      lastProjectRef: null,
      email: null,
    });

    await deleteProfile(metadata.id);
    expect(getProfiles()).toHaveLength(0);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
  });

  it('clears active profile ID when active profile is deleted', async () => {
    const metadata = await saveProfile({
      name: 'Active',
      apiKey: 'tr_pat_active',
      serverUrl: 'https://api.trigger.dev',
      lastProjectRef: 'proj_abc',
      email: null,
    });

    setActiveProfileId(metadata.id);
    expect(getActiveProfileId()).toBe(metadata.id);

    await deleteProfile(metadata.id);
    expect(getActiveProfileId()).toBeNull();
  });
});

describe('getProfileApiKey', () => {
  it('calls SecureStore.getItemAsync', async () => {
    SecureStore.getItemAsync.mockResolvedValue('tr_pat_key123');
    const key = await getProfileApiKey('test_id');
    expect(key).toBe('tr_pat_key123');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('profile_key_test_id');
  });
});
