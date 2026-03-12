import { useNetworkStore } from '@/stores/network-store';
import { showOfflineToast } from '@/components/shared/offline-action-toast';
import { useToastStore } from '@/stores/toast-store';

describe('offline behavior', () => {
  beforeEach(() => {
    useNetworkStore.setState({ isConnected: true, lastSyncTime: null });
    useToastStore.setState({ toast: null });
  });

  describe('network store connectivity', () => {
    it('tracks connectivity changes', () => {
      expect(useNetworkStore.getState().isConnected).toBe(true);
      useNetworkStore.getState().setConnected(false);
      expect(useNetworkStore.getState().isConnected).toBe(false);
      useNetworkStore.getState().setConnected(true);
      expect(useNetworkStore.getState().isConnected).toBe(true);
    });
  });

  describe('showOfflineToast', () => {
    it('shows a warning toast with offline message', () => {
      showOfflineToast();
      const toast = useToastStore.getState().toast;
      expect(toast).toBeTruthy();
      expect(toast?.type).toBe('warning');
      expect(toast?.title).toBe('You are offline');
      expect(toast?.message).toBe('This action requires an internet connection.');
    });
  });

  describe('mutation guard pattern', () => {
    it('blocks action when offline and shows toast', () => {
      useNetworkStore.getState().setConnected(false);

      const isConnected = useNetworkStore.getState().isConnected;
      const actionExecuted = { value: false };

      if (!isConnected) {
        showOfflineToast();
      } else {
        actionExecuted.value = true;
      }

      expect(actionExecuted.value).toBe(false);
      expect(useToastStore.getState().toast?.type).toBe('warning');
    });

    it('allows action when online', () => {
      useNetworkStore.getState().setConnected(true);

      const isConnected = useNetworkStore.getState().isConnected;
      const actionExecuted = { value: false };

      if (!isConnected) {
        showOfflineToast();
      } else {
        actionExecuted.value = true;
      }

      expect(actionExecuted.value).toBe(true);
      expect(useToastStore.getState().toast).toBeNull();
    });
  });

  describe('lastSyncTime tracking', () => {
    it('updates on successful API response', () => {
      expect(useNetworkStore.getState().lastSyncTime).toBeNull();
      const now = new Date().toISOString();
      useNetworkStore.getState().setLastSyncTime(now);
      expect(useNetworkStore.getState().lastSyncTime).toBe(now);
    });

    it('records the most recent sync time', () => {
      const first = '2026-01-15T10:00:00.000Z';
      const second = '2026-01-15T10:05:00.000Z';
      useNetworkStore.getState().setLastSyncTime(first);
      useNetworkStore.getState().setLastSyncTime(second);
      expect(useNetworkStore.getState().lastSyncTime).toBe(second);
    });
  });
});
