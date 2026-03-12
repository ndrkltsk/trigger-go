import { useCallback } from 'react';
import { useNetworkStore } from '@/stores/network-store';
import { useToast } from '@/stores/toast-store';

export function useOfflineGuard() {
  const isConnected = useNetworkStore((s) => s.isConnected);
  const { showToast } = useToast();

  const guardAction = useCallback(
    (action: () => void | Promise<void>) => {
      if (!isConnected) {
        showToast({
          type: 'warning',
          title: 'You are offline',
          message: 'This action requires an internet connection.',
        });
        return;
      }
      action();
    },
    [isConnected, showToast]
  );

  return { isOffline: !isConnected, guardAction };
}
