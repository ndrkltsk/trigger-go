import { usePreferencesStore } from '@/stores/preferences-store';
import { storage } from '@/lib/storage';

// Reset zustand stores between tests
const initialPreferencesState = usePreferencesStore.getState();

beforeEach(() => {
  usePreferencesStore.setState(initialPreferencesState);
  jest.clearAllMocks();
});

describe('preferences-store environment selection', () => {
  it('defaults selectedEnvironment to dev', () => {
    const { selectedEnvironment } = usePreferencesStore.getState();
    expect(selectedEnvironment).toBe('dev');
  });

  it('setEnvironment updates the selected environment', () => {
    usePreferencesStore.getState().setEnvironment('staging');
    expect(usePreferencesStore.getState().selectedEnvironment).toBe('staging');
    expect(storage.set).toHaveBeenCalledWith('selectedEnvironment', 'staging');
  });

  it('loadPreferences restores persisted environment', () => {
    (storage.getString as jest.Mock).mockImplementation((key: string) => {
      if (key === 'selectedEnvironment') return 'prod';
      return undefined;
    });

    usePreferencesStore.getState().loadPreferences();
    expect(usePreferencesStore.getState().selectedEnvironment).toBe('prod');
  });

  it('loadPreferences defaults to dev when no persisted value exists', () => {
    (storage.getString as jest.Mock).mockReturnValue(undefined);

    usePreferencesStore.getState().loadPreferences();
    expect(usePreferencesStore.getState().selectedEnvironment).toBe('dev');
  });
});

describe('notification preferences', () => {
  it('has correct defaults', () => {
    const state = usePreferencesStore.getState();
    expect(state.notificationsEnabled).toBe(true);
    expect(state.notifyOnFailures).toBe(true);
    expect(state.notifyOnCompletions).toBe(false);
    expect(state.notifyOnDelays).toBe(false);
    expect(state.notifyEnvironments).toEqual({ dev: false, staging: false, prod: true, preview: false });
    expect(state.quietHoursEnabled).toBe(false);
    expect(state.quietHoursStart).toBe('22:00');
    expect(state.quietHoursEnd).toBe('07:00');
  });

  it('setNotifyOnFailures updates and persists', () => {
    usePreferencesStore.getState().setNotifyOnFailures(false);
    expect(usePreferencesStore.getState().notifyOnFailures).toBe(false);
    expect(storage.set).toHaveBeenCalledWith('notifyOnFailures', false);
  });

  it('setNotifyOnCompletions updates and persists', () => {
    usePreferencesStore.getState().setNotifyOnCompletions(true);
    expect(usePreferencesStore.getState().notifyOnCompletions).toBe(true);
    expect(storage.set).toHaveBeenCalledWith('notifyOnCompletions', true);
  });

  it('setNotifyOnDelays updates and persists', () => {
    usePreferencesStore.getState().setNotifyOnDelays(true);
    expect(usePreferencesStore.getState().notifyOnDelays).toBe(true);
    expect(storage.set).toHaveBeenCalledWith('notifyOnDelays', true);
  });

  it('setNotifyEnvironments updates and persists as JSON', () => {
    const envs = { dev: true, staging: true, prod: false, preview: false };
    usePreferencesStore.getState().setNotifyEnvironments(envs);
    expect(usePreferencesStore.getState().notifyEnvironments).toEqual(envs);
    expect(storage.set).toHaveBeenCalledWith('notifyEnvironments', JSON.stringify(envs));
  });

  it('setQuietHoursEnabled updates and persists', () => {
    usePreferencesStore.getState().setQuietHoursEnabled(true);
    expect(usePreferencesStore.getState().quietHoursEnabled).toBe(true);
    expect(storage.set).toHaveBeenCalledWith('quietHoursEnabled', true);
  });

  it('setQuietHoursStart updates and persists', () => {
    usePreferencesStore.getState().setQuietHoursStart('23:00');
    expect(usePreferencesStore.getState().quietHoursStart).toBe('23:00');
    expect(storage.set).toHaveBeenCalledWith('quietHoursStart', '23:00');
  });

  it('setQuietHoursEnd updates and persists', () => {
    usePreferencesStore.getState().setQuietHoursEnd('08:00');
    expect(usePreferencesStore.getState().quietHoursEnd).toBe('08:00');
    expect(storage.set).toHaveBeenCalledWith('quietHoursEnd', '08:00');
  });
});

describe('background check preferences', () => {
  it('has correct defaults', () => {
    const state = usePreferencesStore.getState();
    expect(state.backgroundCheckEnabled).toBe(true);
    expect(state.backgroundCheckInterval).toBe('15');
  });

  it('setBackgroundCheckEnabled updates and persists', () => {
    usePreferencesStore.getState().setBackgroundCheckEnabled(false);
    expect(usePreferencesStore.getState().backgroundCheckEnabled).toBe(false);
    expect(storage.set).toHaveBeenCalledWith('backgroundCheckEnabled', false);
  });

  it('setBackgroundCheckInterval updates and persists', () => {
    usePreferencesStore.getState().setBackgroundCheckInterval('30');
    expect(usePreferencesStore.getState().backgroundCheckInterval).toBe('30');
    expect(storage.set).toHaveBeenCalledWith('backgroundCheckInterval', '30');
  });

  it('loadPreferences restores background check settings', () => {
    (storage.getBoolean as jest.Mock).mockImplementation((key: string) => {
      if (key === 'backgroundCheckEnabled') return false;
      return undefined;
    });
    (storage.getString as jest.Mock).mockImplementation((key: string) => {
      if (key === 'backgroundCheckInterval') return '60';
      return undefined;
    });

    usePreferencesStore.getState().loadPreferences();
    expect(usePreferencesStore.getState().backgroundCheckEnabled).toBe(false);
    expect(usePreferencesStore.getState().backgroundCheckInterval).toBe('60');
  });
});
