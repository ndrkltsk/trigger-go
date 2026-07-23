import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

const mockCheckForNewFailures = jest.fn();
const mockStorage = new Map<string, string | number | boolean>();

jest.mock('@/services/notifications/failure-detector', () => ({
  checkForNewFailures: () => mockCheckForNewFailures(),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('@/lib/storage', () => ({
  storage: {
    getString: (key: string) => {
      const val = mockStorage.get(key);
      return typeof val === 'string' ? val : undefined;
    },
    getBoolean: (key: string) => {
      const val = mockStorage.get(key);
      return typeof val === 'boolean' ? val : undefined;
    },
    getNumber: (key: string) => {
      const val = mockStorage.get(key);
      return typeof val === 'number' ? val : undefined;
    },
    set: (key: string, value: string | number | boolean) => {
      mockStorage.set(key, value);
    },
  },
}));

let mockAuthState = { token: 'test-token', projectRef: 'proj_test' };
const mockLoadCredentials = jest.fn().mockResolvedValue(undefined);

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: {
    getState: () => ({ ...mockAuthState, loadCredentials: mockLoadCredentials }),
  },
}));

let mockPrefsState: {
  notificationsEnabled: boolean;
  backgroundCheckEnabled: boolean;
  backgroundCheckInterval: string;
  notifyOnFailures: boolean;
  notifyOnCompletions: boolean;
  notifyOnDelays: boolean;
  notifyEnvironments: Record<string, boolean>;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  selectedEnvironment: string;
} = {
  notificationsEnabled: true,
  backgroundCheckEnabled: true,
  backgroundCheckInterval: '15',
  notifyOnFailures: true,
  notifyOnCompletions: false,
  notifyOnDelays: false,
  notifyEnvironments: { dev: false, staging: false, prod: true, preview: false },
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  selectedEnvironment: 'dev',
};
const mockLoadPreferences = jest.fn();

jest.mock('@/stores/preferences-store', () => ({
  usePreferencesStore: {
    getState: () => ({ ...mockPrefsState, loadPreferences: mockLoadPreferences }),
  },
}));

const mockLoadRules = jest.fn();

jest.mock('@/stores/notification-rules-store', () => ({
  useNotificationRulesStore: {
    getState: () => ({ rules: [], loadRules: mockLoadRules }),
  },
}));

// Import after mocks are set up
import {
  registerBackgroundNotificationCheck,
  unregisterBackgroundNotificationCheck,
  getBackgroundFetchStatus,
  getLastBackgroundRunTime,
} from '../background-task';

describe('background-task', () => {
  let taskCallback: () => Promise<number>;

  beforeAll(() => {
    // Capture the task callback registered via defineTask
    const defineTaskCalls = (TaskManager.defineTask as jest.Mock).mock.calls;
    expect(defineTaskCalls.length).toBeGreaterThan(0);
    expect(defineTaskCalls[0][0]).toBe('background-notification-check');
    taskCallback = defineTaskCalls[0][1];
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.clear();
    mockAuthState = { token: 'test-token', projectRef: 'proj_test' };
    mockPrefsState = {
      notificationsEnabled: true,
      backgroundCheckEnabled: true,
      backgroundCheckInterval: '15',
      notifyOnFailures: true,
      notifyOnCompletions: false,
      notifyOnDelays: false,
      notifyEnvironments: { dev: false, staging: false, prod: true, preview: false },
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      selectedEnvironment: 'dev',
    };
    mockCheckForNewFailures.mockResolvedValue(undefined);
  });

  describe('task callback', () => {
    it('hydrates stores before checking', async () => {
      await taskCallback();

      expect(mockLoadCredentials).toHaveBeenCalled();
      expect(mockLoadPreferences).toHaveBeenCalled();
      expect(mockLoadRules).toHaveBeenCalled();
    });

    it('calls checkForNewFailures when authenticated and enabled', async () => {
      const result = await taskCallback();

      expect(mockCheckForNewFailures).toHaveBeenCalledTimes(1);
      expect(result).toBe(BackgroundFetch.BackgroundFetchResult.NewData);
    });

    it('saves last run time after successful check', async () => {
      await taskCallback();

      expect(mockStorage.get('background_lastRunAt')).toBeDefined();
    });

    it('returns NoData when not authenticated', async () => {
      mockAuthState = { token: null as unknown as string, projectRef: null as unknown as string };

      const result = await taskCallback();

      expect(mockCheckForNewFailures).not.toHaveBeenCalled();
      expect(result).toBe(BackgroundFetch.BackgroundFetchResult.NoData);
    });

    it('returns NoData when notifications disabled', async () => {
      mockPrefsState = { ...mockPrefsState, notificationsEnabled: false };

      const result = await taskCallback();

      expect(mockCheckForNewFailures).not.toHaveBeenCalled();
      expect(result).toBe(BackgroundFetch.BackgroundFetchResult.NoData);
    });

    it('returns NoData when background checks disabled', async () => {
      mockPrefsState = { ...mockPrefsState, backgroundCheckEnabled: false };

      const result = await taskCallback();

      expect(mockCheckForNewFailures).not.toHaveBeenCalled();
      expect(result).toBe(BackgroundFetch.BackgroundFetchResult.NoData);
    });

    it('returns Failed when checkForNewFailures throws', async () => {
      mockCheckForNewFailures.mockRejectedValue(new Error('Network error'));

      const result = await taskCallback();

      expect(result).toBe(BackgroundFetch.BackgroundFetchResult.Failed);
    });
  });

  describe('registerBackgroundNotificationCheck', () => {
    it('registers the task with correct interval', async () => {
      await registerBackgroundNotificationCheck();

      expect(BackgroundFetch.registerTaskAsync).toHaveBeenCalledWith(
        'background-notification-check',
        expect.objectContaining({
          minimumInterval: 15 * 60,
          stopOnTerminate: false,
          startOnBoot: true,
        })
      );
    });

    it('unregisters existing task before re-registering', async () => {
      (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValueOnce(true);

      await registerBackgroundNotificationCheck();

      expect(BackgroundFetch.unregisterTaskAsync).toHaveBeenCalledWith(
        'background-notification-check'
      );
      expect(BackgroundFetch.registerTaskAsync).toHaveBeenCalled();
    });

    it('uses 30-minute interval when configured', async () => {
      mockPrefsState = { ...mockPrefsState, backgroundCheckInterval: '30' };

      await registerBackgroundNotificationCheck();

      expect(BackgroundFetch.registerTaskAsync).toHaveBeenCalledWith(
        'background-notification-check',
        expect.objectContaining({ minimumInterval: 30 * 60 })
      );
    });

    it('uses 60-minute interval when configured', async () => {
      mockPrefsState = { ...mockPrefsState, backgroundCheckInterval: '60' };

      await registerBackgroundNotificationCheck();

      expect(BackgroundFetch.registerTaskAsync).toHaveBeenCalledWith(
        'background-notification-check',
        expect.objectContaining({ minimumInterval: 60 * 60 })
      );
    });
  });

  describe('unregisterBackgroundNotificationCheck', () => {
    it('unregisters when task is registered', async () => {
      (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValueOnce(true);

      await unregisterBackgroundNotificationCheck();

      expect(BackgroundFetch.unregisterTaskAsync).toHaveBeenCalledWith(
        'background-notification-check'
      );
    });

    it('does nothing when task is not registered', async () => {
      (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValueOnce(false);

      await unregisterBackgroundNotificationCheck();

      expect(BackgroundFetch.unregisterTaskAsync).not.toHaveBeenCalled();
    });
  });

  describe('getBackgroundFetchStatus', () => {
    it('returns status from BackgroundFetch', async () => {
      const status = await getBackgroundFetchStatus();
      expect(status).toBe(BackgroundFetch.BackgroundFetchStatus.Available);
    });
  });

  describe('getLastBackgroundRunTime', () => {
    it('returns null when no run time stored', () => {
      expect(getLastBackgroundRunTime()).toBeNull();
    });

    it('returns stored run time', () => {
      mockStorage.set('background_lastRunAt', '2025-01-15T10:00:00Z');
      expect(getLastBackgroundRunTime()).toBe('2025-01-15T10:00:00Z');
    });
  });
});
