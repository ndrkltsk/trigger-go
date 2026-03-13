import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeToRun, type RunSubscription } from '@/services/realtime/subscriptions';
import { runKeys } from '@/hooks/api/use-runs';
import { useAuthStore } from '@/stores/auth-store';
import { useNetworkStore } from '@/stores/network-store';
import { isTerminalStatus } from '@/lib/status-colors';
import type { RetrieveRunResponse } from '@/services/api/runs';
import { metrics } from '@/services/sentry';

export function useRealtimeRun(runId: string, enabled: boolean) {
  const queryClient = useQueryClient();
  const { token, baseUrl } = useAuthStore();
  const isConnected = useNetworkStore((s) => s.isConnected);
  const subscriptionRef = useRef<RunSubscription | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !token || !runId || !isConnected) {
      // Close existing subscription when going offline
      if (subscriptionRef.current) {
        subscriptionRef.current.close();
        subscriptionRef.current = null;
      }
      return;
    }

    retryCountRef.current = 0;

    function connect() {
      const subscription = subscribeToRun(runId, token!, baseUrl);
      subscriptionRef.current = subscription;

      subscription.onUpdate((updatedRun: RetrieveRunResponse) => {
        retryCountRef.current = 0;
        queryClient.setQueryData(runKeys.detail(runId), updatedRun);

        if (updatedRun.status && isTerminalStatus(updatedRun.status)) {
          subscription.close();
          subscriptionRef.current = null;
        }
      });

      subscription.onError(() => {
        subscription.close();
        subscriptionRef.current = null;

        // Only retry if still connected and not at max retries
        if (useNetworkStore.getState().isConnected && retryCountRef.current < 5) {
          const delay = Math.min(1000 * 2 ** retryCountRef.current, 30_000);
          retryCountRef.current += 1;
          metrics.count('realtime.subscription.retry', 1, { attributes: { attempt: String(retryCountRef.current) } });
          retryTimerRef.current = setTimeout(connect, delay);
        }
      });
    }

    connect();

    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.close();
        subscriptionRef.current = null;
      }
    };
  }, [runId, enabled, token, baseUrl, isConnected, queryClient]);
}
