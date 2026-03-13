import EventSource from 'react-native-sse';
import type { RetrieveRunResponse } from '@/services/api/runs';
import { metrics } from '@/services/sentry';

export interface RunSubscription {
  onUpdate: (callback: (run: RetrieveRunResponse) => void) => void;
  onError: (callback: (error: { type: string; message?: string }) => void) => void;
  close: () => void;
}

export function subscribeToRun(
  runId: string,
  token: string,
  baseUrl: string
): RunSubscription {
  const url = `${baseUrl}/realtime/v1/runs/${runId}`;

  const es = new EventSource<'update'>(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  metrics.count('realtime.subscription.open', 1);

  return {
    onUpdate(callback) {
      es.addEventListener('update', (event) => {
        if (event.data) {
          try {
            const run = JSON.parse(event.data) as RetrieveRunResponse;
            metrics.count('realtime.message.received', 1);
            callback(run);
          } catch {
            metrics.count('realtime.message.parse_error', 1);
          }
        }
      });
    },

    onError(callback) {
      es.addEventListener('error', (event) => {
        metrics.count('realtime.subscription.error', 1);
        const err = event as { type: string; message?: string };
        callback(err);
      });
    },

    close() {
      metrics.count('realtime.subscription.close', 1);
      es.close();
    },
  };
}
