import { useProfilesStore } from '@/stores/profiles-store';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn().mockResolvedValue('tr_pat_testkey123'),
  deleteItemAsync: jest.fn(),
}));

const mockStore: Record<string, string> = {};
jest.mock('@/lib/storage', () => ({
  storage: {
    getString: (key: string) => mockStore[key] ?? undefined,
    set: (key: string, value: string) => { mockStore[key] = value; },
    remove: (key: string) => { delete mockStore[key]; },
  },
}));

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: {
    getState: () => ({
      setCredentials: jest.fn(),
      clearCredentials: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

jest.mock('@/services/api/client', () => ({
  resetApiClient: jest.fn(),
}));

jest.mock('@/services/sentry', () => ({
  Sentry: {
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), fmt: (s: TemplateStringsArray, ...v: unknown[]) => String.raw(s, ...v) },
    captureException: jest.fn(),
    addBreadcrumb: jest.fn(),
  },
}));

beforeEach(() => {
  Object.keys(mockStore).forEach((k) => delete mockStore[k]);
  useProfilesStore.setState({ profiles: [], activeProfileId: null });
});

describe('useProfilesStore', () => {
  it('starts with empty profiles', () => {
    expect(useProfilesStore.getState().profiles).toEqual([]);
    expect(useProfilesStore.getState().activeProfileId).toBeNull();
  });

  it('adds a profile', async () => {
    const metadata = await useProfilesStore.getState().addProfile({
      name: 'Test Project',
      apiKey: 'tr_pat_abc',
      serverUrl: 'https://api.trigger.dev',
      lastProjectRef: null,
      email: null,
    });

    expect(metadata.name).toBe('Test Project');
    expect(useProfilesStore.getState().profiles).toHaveLength(1);
  });

  it('renames a profile', async () => {
    const metadata = await useProfilesStore.getState().addProfile({
      name: 'Original',
      apiKey: 'tr_pat_abc',
      serverUrl: 'https://api.trigger.dev',
      lastProjectRef: null,
      email: null,
    });

    useProfilesStore.getState().renameProfile(metadata.id, 'Renamed');
    expect(useProfilesStore.getState().profiles[0].name).toBe('Renamed');
  });

  it('removes a profile', async () => {
    const metadata = await useProfilesStore.getState().addProfile({
      name: 'To Delete',
      apiKey: 'tr_pat_abc',
      serverUrl: 'https://api.trigger.dev',
      lastProjectRef: null,
      email: null,
    });

    await useProfilesStore.getState().removeProfile(metadata.id);
    expect(useProfilesStore.getState().profiles).toHaveLength(0);
  });

  it('updates last project', async () => {
    const metadata = await useProfilesStore.getState().addProfile({
      name: 'Test',
      apiKey: 'tr_pat_abc',
      serverUrl: 'https://api.trigger.dev',
      lastProjectRef: null,
      email: null,
    });

    useProfilesStore.getState().updateLastProject(metadata.id, 'proj_abc');
    expect(useProfilesStore.getState().profiles[0].lastProjectRef).toBe('proj_abc');
  });

  it('clears activeProfileId when active profile is removed', async () => {
    const metadata = await useProfilesStore.getState().addProfile({
      name: 'Active',
      apiKey: 'tr_pat_abc',
      serverUrl: 'https://api.trigger.dev',
      lastProjectRef: null,
      email: null,
    });

    useProfilesStore.setState({ activeProfileId: metadata.id });
    await useProfilesStore.getState().removeProfile(metadata.id);
    expect(useProfilesStore.getState().activeProfileId).toBeNull();
  });
});
