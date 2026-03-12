import { create } from 'zustand';

interface NetworkState {
  isConnected: boolean;
  lastSyncTime: string | null;

  setConnected: (connected: boolean) => void;
  setLastSyncTime: (time: string) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isConnected: true,
  lastSyncTime: null,

  setConnected: (connected) => set({ isConnected: connected }),
  setLastSyncTime: (time) => set({ lastSyncTime: time }),
}));
