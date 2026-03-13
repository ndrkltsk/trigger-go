import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { listProjectRuns, type ListRunItem } from '@/services/api/runs';
import { storage } from '@/lib/storage';
import { usePreferencesStore } from '@/stores/preferences-store';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationRulesStore, type NotificationEvent } from '@/stores/notification-rules-store';
import { matchRules, hasHighSeverityMatch } from './rule-matcher';
import { metrics } from '@/services/sentry';

const LAST_CHECKED_KEY = 'notification_lastCheckedAt';
const NOTIFICATION_COUNT_KEY = 'notification_minuteCount';
const NOTIFICATION_RESET_KEY = 'notification_minuteResetAt';
const MAX_NOTIFICATIONS_PER_MINUTE = 10;

const FAILURE_STATUSES = ['FAILED', 'CRASHED', 'SYSTEM_FAILURE'];
const COMPLETION_STATUSES = ['COMPLETED'];
const DELAY_STATUSES = ['FROZEN'];

function getLastCheckedAt(): string | null {
  return storage.getString(LAST_CHECKED_KEY) ?? null;
}

function setLastCheckedAt(timestamp: string): void {
  storage.set(LAST_CHECKED_KEY, timestamp);
}

function checkRateLimit(): boolean {
  const now = Date.now();
  const resetAt = storage.getNumber(NOTIFICATION_RESET_KEY) ?? 0;

  if (now - resetAt > 60_000) {
    // Reset the counter every minute
    storage.set(NOTIFICATION_COUNT_KEY, 0);
    storage.set(NOTIFICATION_RESET_KEY, now);
    return true;
  }

  const count = storage.getNumber(NOTIFICATION_COUNT_KEY) ?? 0;
  return count < MAX_NOTIFICATIONS_PER_MINUTE;
}

function incrementNotificationCount(): void {
  const count = storage.getNumber(NOTIFICATION_COUNT_KEY) ?? 0;
  storage.set(NOTIFICATION_COUNT_KEY, count + 1);
}

function isInQuietHours(): boolean {
  const { quietHoursEnabled, quietHoursStart, quietHoursEnd } = usePreferencesStore.getState();
  if (!quietHoursEnabled) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = quietHoursStart.split(':').map(Number);
  const [endH, endM] = quietHoursEnd.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    // Same day range (e.g., 09:00 - 17:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  // Crosses midnight (e.g., 22:00 - 07:00)
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

function buildEventFromRun(run: ListRunItem): NotificationEvent {
  return {
    taskIdentifier: run.taskIdentifier,
    status: run.status,
    environment: run.env.name,
    tags: (run as Record<string, unknown>).tags as string[] | undefined,
  };
}

function shouldNotifyForRun(run: ListRunItem): boolean {
  const {
    notifyOnFailures,
    notifyOnCompletions,
    notifyOnDelays,
    notifyEnvironments,
  } = usePreferencesStore.getState();

  // Check custom rules first
  const { rules } = useNotificationRulesStore.getState();
  const event = buildEventFromRun(run);
  const matchingRules = matchRules(event, rules);

  if (matchingRules.length > 0) {
    // Custom rule matched - high severity bypasses quiet hours
    if (isInQuietHours() && !hasHighSeverityMatch(event, rules)) {
      return false;
    }
    return true;
  }

  // Fall back to default global notification behavior
  // Check environment
  const envName = run.env.name.toLowerCase();
  if (envName in notifyEnvironments && !notifyEnvironments[envName as keyof typeof notifyEnvironments]) {
    return false;
  }

  // Check event type
  if (FAILURE_STATUSES.includes(run.status) && !notifyOnFailures) return false;
  if (COMPLETION_STATUSES.includes(run.status) && !notifyOnCompletions) return false;
  if (DELAY_STATUSES.includes(run.status) && !notifyOnDelays) return false;

  // Check quiet hours
  if (isInQuietHours()) return false;

  return true;
}

function getNotificationTitle(run: ListRunItem): string {
  if (FAILURE_STATUSES.includes(run.status)) return `${run.taskIdentifier} failed`;
  if (COMPLETION_STATUSES.includes(run.status)) return `${run.taskIdentifier} completed`;
  if (DELAY_STATUSES.includes(run.status)) return `${run.taskIdentifier} delayed`;
  return `${run.taskIdentifier} ${run.status.toLowerCase()}`;
}

async function scheduleNotification(run: ListRunItem): Promise<void> {
  if (!checkRateLimit()) {
    metrics.count('notifications.rate_limited', 1);
    return;
  }
  if (!shouldNotifyForRun(run)) {
    if (isInQuietHours()) {
      metrics.count('notifications.quiet_hours_suppressed', 1);
    }
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: getNotificationTitle(run),
      body: `in ${run.env.name}`,
      data: { runId: run.id },
      ...(Platform.OS === 'android' ? { channelId: 'run-alerts' } : {}),
    },
    trigger: null,
  });

  metrics.count('notifications.scheduled', 1, { attributes: { status: run.status } });
  incrementNotificationCount();
}

export async function checkForNewFailures(): Promise<void> {
  const { notificationsEnabled, notifyOnFailures, notifyOnCompletions, notifyOnDelays } =
    usePreferencesStore.getState();
  if (!notificationsEnabled) return;

  const { projectRef } = useAuthStore.getState();
  const { selectedEnvironment } = usePreferencesStore.getState();
  if (!projectRef) return;

  // Build the list of statuses to check based on preferences
  const statuses: string[] = [];
  if (notifyOnFailures) statuses.push(...FAILURE_STATUSES);
  if (notifyOnCompletions) statuses.push(...COMPLETION_STATUSES);
  if (notifyOnDelays) statuses.push(...DELAY_STATUSES);
  if (statuses.length === 0) return;

  metrics.count('notifications.check', 1);
  try {
    const result = await listProjectRuns(projectRef, {
      status: statuses,
      pageSize: 10,
      env: [selectedEnvironment],
    });

    const runs = result.data ?? [];
    if (runs.length === 0) return;

    const lastChecked = getLastCheckedAt();

    // Find runs that are newer than our last check
    const newFailures = lastChecked
      ? runs.filter((run) => new Date(run.createdAt) > new Date(lastChecked))
      : []; // On first run, don't notify for existing failures

    // Update last checked timestamp to the most recent run
    const mostRecent = runs[0];
    if (mostRecent) {
      setLastCheckedAt(mostRecent.createdAt);
    }

    if (newFailures.length > 0) {
      metrics.distribution('notifications.new_failures', newFailures.length);
    }

    // Schedule notifications for new failures
    for (const run of newFailures) {
      await scheduleNotification(run);
    }
  } catch {
    metrics.count('notifications.check.error', 1);
  }
}
