import { listProjectRuns } from '@/services/api/runs';
import { useAuthStore } from '@/stores/auth-store';
import { usePreferencesStore } from '@/stores/preferences-store';
import { metrics } from '@/services/sentry';

export type HealthIndicator = 'green' | 'yellow' | 'red';

const FAILED_STATUSES = ['FAILED', 'CRASHED', 'SYSTEM_FAILURE', 'TIMED_OUT'];
const RUNNING_STATUSES = ['EXECUTING', 'REATTEMPTING'];
const QUEUED_STATUSES = ['QUEUED', 'PENDING_VERSION', 'DELAYED', 'FROZEN'];

export interface WidgetData {
  activeCount: number;
  failedCount: number;
  queuedCount: number;
  health: HealthIndicator;
  lastUpdated: Date;
}

export interface WidgetFetchError {
  type: 'auth' | 'network' | 'unknown';
  message: string;
}

export type WidgetFetchResult =
  | { success: true; data: WidgetData }
  | { success: false; error: WidgetFetchError };

export function computeHealthIndicator(failedCount: number): HealthIndicator {
  if (failedCount === 0) return 'green';
  if (failedCount <= 5) return 'yellow';
  return 'red';
}

export async function fetchWidgetData(): Promise<WidgetFetchResult> {
  try {
    const { projectRef } = useAuthStore.getState();
    const { selectedEnvironment } = usePreferencesStore.getState();

    if (!projectRef) {
      return {
        success: true,
        data: {
          activeCount: 0,
          failedCount: 0,
          queuedCount: 0,
          health: 'green',
          lastUpdated: new Date(),
        },
      };
    }

    let activeCount = 0;
    let failedCount = 0;
    let queuedCount = 0;

    let after: string | undefined;
    const widgetStart = Date.now();

    do {
      const result = await listProjectRuns(projectRef, {
        pageSize: 100,
        createdAtPeriod: '24h',
        after,
        env: [selectedEnvironment],
      });
      const runs = result.data ?? [];

      for (const run of runs) {
        if (RUNNING_STATUSES.includes(run.status)) activeCount++;
        else if (FAILED_STATUSES.includes(run.status)) failedCount++;
        else if (QUEUED_STATUSES.includes(run.status)) queuedCount++;
      }

      after = result.pagination?.next ?? undefined;
    } while (after);

    const health = computeHealthIndicator(failedCount);
    metrics.distribution('widget.fetch.duration', Date.now() - widgetStart, { unit: 'millisecond' });
    metrics.count('widget.fetch.success', 1, { attributes: { health } });

    return {
      success: true,
      data: {
        activeCount,
        failedCount,
        queuedCount,
        health,
        lastUpdated: new Date(),
      },
    };
  } catch (err) {
    const error = err as { status?: number; message?: string };

    if (error.status === 401) {
      metrics.count('widget.fetch.error', 1, { attributes: { type: 'auth' } });
      return {
        success: false,
        error: { type: 'auth', message: 'Sign in required' },
      };
    }

    if (
      error.message?.includes('Network') ||
      error.message?.includes('fetch') ||
      error.message?.includes('timeout')
    ) {
      metrics.count('widget.fetch.error', 1, { attributes: { type: 'network' } });
      return {
        success: false,
        error: { type: 'network', message: 'Unable to connect' },
      };
    }

    metrics.count('widget.fetch.error', 1, { attributes: { type: 'unknown' } });
    return {
      success: false,
      error: { type: 'unknown', message: error.message ?? 'Unknown error' },
    };
  }
}
