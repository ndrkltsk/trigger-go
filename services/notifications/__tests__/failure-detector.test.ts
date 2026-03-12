import { checkForNewFailures } from '../failure-detector';

const mockListProjectRuns = jest.fn();
const mockScheduleNotificationAsync = jest.fn();
const mockStorage = new Map<string, string | number | boolean>();

jest.mock('@/services/api/runs', () => ({
  listProjectRuns: (...args: unknown[]) => mockListProjectRuns(...args),
}));

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: (...args: unknown[]) => mockScheduleNotificationAsync(...args),
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
    getNumber: (key: string) => {
      const val = mockStorage.get(key);
      return typeof val === 'number' ? val : undefined;
    },
    getBoolean: (key: string) => {
      const val = mockStorage.get(key);
      return typeof val === 'boolean' ? val : undefined;
    },
    set: (key: string, value: string | number | boolean) => {
      mockStorage.set(key, value);
    },
  },
}));

const defaultPrefs = {
  notificationsEnabled: true,
  notifyOnFailures: true,
  notifyOnCompletions: false,
  notifyOnDelays: false,
  notifyEnvironments: { dev: false, staging: false, prod: true },
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  selectedEnvironment: 'dev',
};

let mockPrefs = { ...defaultPrefs };

jest.mock('@/stores/preferences-store', () => ({
  usePreferencesStore: {
    getState: () => mockPrefs,
  },
}));

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: {
    getState: () => ({ projectRef: 'proj_test' }),
  },
}));

function makeRun(overrides: Record<string, unknown> = {}) {
  return {
    id: 'run_test',
    status: 'FAILED',
    taskIdentifier: 'my-task',
    createdAt: new Date().toISOString(),
    env: { id: 'env_1', name: 'prod' },
    isTest: false,
    ...overrides,
  };
}

describe('checkForNewFailures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.clear();
    mockPrefs = { ...defaultPrefs };
  });

  it('fetches runs with failure statuses', async () => {
    mockListProjectRuns.mockResolvedValue({ data: [] });

    await checkForNewFailures();

    expect(mockListProjectRuns).toHaveBeenCalledWith('proj_test', {
      status: ['FAILED', 'CRASHED', 'SYSTEM_FAILURE'],
      pageSize: 10,
      env: ['dev'],
    });
  });

  it('does not notify on first run (no previous timestamp)', async () => {
    mockListProjectRuns.mockResolvedValue({
      data: [makeRun({ id: 'run_1', createdAt: '2025-01-15T10:00:00Z' })],
    });

    await checkForNewFailures();

    expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
    expect(mockStorage.get('notification_lastCheckedAt')).toBe('2025-01-15T10:00:00Z');
  });

  it('notifies for new failures after the last check', async () => {
    mockStorage.set('notification_lastCheckedAt', '2025-01-15T09:00:00Z');

    mockListProjectRuns.mockResolvedValue({
      data: [
        makeRun({ id: 'run_new', taskIdentifier: 'send-email', createdAt: '2025-01-15T10:00:00Z', env: { id: 'e1', name: 'prod' } }),
        makeRun({ id: 'run_old', createdAt: '2025-01-15T08:00:00Z' }),
      ],
    });

    await checkForNewFailures();

    expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: 'send-email failed',
          body: 'in prod',
          data: { runId: 'run_new' },
        }),
        trigger: null,
      })
    );
  });

  it('does not notify when notifications are disabled', async () => {
    mockPrefs = { ...defaultPrefs, notificationsEnabled: false };

    mockListProjectRuns.mockResolvedValue({
      data: [makeRun({ id: 'run_1', createdAt: '2025-01-15T10:00:00Z' })],
    });

    await checkForNewFailures();

    expect(mockListProjectRuns).not.toHaveBeenCalled();
    expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('handles API errors gracefully', async () => {
    mockListProjectRuns.mockRejectedValue(new Error('Network error'));

    await expect(checkForNewFailures()).resolves.not.toThrow();
    expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('handles empty data response', async () => {
    mockListProjectRuns.mockResolvedValue({ data: [] });

    await checkForNewFailures();

    expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
