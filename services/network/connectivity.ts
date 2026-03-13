import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useNetworkStore } from '@/stores/network-store';
import { metrics } from '@/services/sentry';

let unsubscribe: (() => void) | null = null;
let previouslyConnected: boolean | null = null;

function handleNetInfoChange(state: NetInfoState) {
  const connected = state.isConnected ?? false;

  if (previouslyConnected !== null && connected !== previouslyConnected) {
    metrics.count('network.state_change', 1, { attributes: { connected: String(connected) } });
  }
  previouslyConnected = connected;

  useNetworkStore.getState().setConnected(connected);
}

export function startNetworkListener(): void {
  if (unsubscribe) return;
  unsubscribe = NetInfo.addEventListener(handleNetInfoChange);
}

export function stopNetworkListener(): void {
  unsubscribe?.();
  unsubscribe = null;
}

export function recordSuccessfulSync(): void {
  useNetworkStore.getState().setLastSyncTime(new Date().toISOString());
}
