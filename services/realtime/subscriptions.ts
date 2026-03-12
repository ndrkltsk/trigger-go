import EventSource from 'react-native-sse';
import type { RetrieveRunResponse } from '@/services/api/runs';

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

  return {
    onUpdate(callback) {
      es.addEventListener('update', (event) => {
        if (event.data) {
          try {
            const run = JSON.parse(event.data) as RetrieveRunResponse;
            callback(run);
          } catch {
            // Ignore malformed data
          }
        }
      });
    },

    onError(callback) {
      es.addEventListener('error', (event) => {
        const err = event as { type: string; message?: string };
        callback(err);
      });
    },

    close() {
      es.close();
    },
  };
}
