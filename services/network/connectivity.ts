import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useNetworkStore } from '@/stores/network-store';

let unsubscribe: (() => void) | null = null;

function handleNetInfoChange(state: NetInfoState) {
  const connected = state.isConnected ?? false;
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
