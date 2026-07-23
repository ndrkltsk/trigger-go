import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { useAuthStore } from '@/stores/auth-store';
import { usePreferencesStore } from '@/stores/preferences-store';
import { useNotificationRulesStore } from '@/stores/notification-rules-store';
import { checkForNewFailures } from './failure-detector';
import { storage } from '@/lib/storage';

const BACKGROUND_NOTIFICATION_TASK = 'background-notification-check';
const LAST_RUN_KEY = 'background_lastRunAt';

const INTERVAL_MAP: Record<string, number> = {
  '15': 15 * 60,
  '30': 30 * 60,
  '60': 60 * 60,
};

async function hydrateStoresForBackground(): Promise<void> {
  await useAuthStore.getState().loadCredentials();
  usePreferencesStore.getState().loadPreferences();
  useNotificationRulesStore.getState().loadRules();
}

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    await hydrateStoresForBackground();

    const { token } = useAuthStore.getState();
    if (!token) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const { notificationsEnabled, backgroundCheckEnabled } =
      usePreferencesStore.getState();
    if (!notificationsEnabled || !backgroundCheckEnabled) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    await checkForNewFailures();

    storage.set(LAST_RUN_KEY, new Date().toISOString());

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundNotificationCheck(): Promise<void> {
  const { backgroundCheckInterval } = usePreferencesStore.getState();
  const minimumInterval = INTERVAL_MAP[backgroundCheckInterval] ?? INTERVAL_MAP['15'];

  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_NOTIFICATION_TASK
  );
  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
  }

  await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
    minimumInterval,
    stopOnTerminate: false,
    startOnBoot: true,
  });
}

export async function unregisterBackgroundNotificationCheck(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_NOTIFICATION_TASK
  );
  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
  }
}

export async function getBackgroundFetchStatus(): Promise<BackgroundFetch.BackgroundFetchStatus | null> {
  return BackgroundFetch.getStatusAsync();
}

export function getLastBackgroundRunTime(): string | null {
  return storage.getString(LAST_RUN_KEY) ?? null;
}
