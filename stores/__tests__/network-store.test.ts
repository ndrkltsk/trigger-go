import { useNetworkStore } from '@/stores/network-store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

beforeEach(() => {
  useNetworkStore.setState({ isConnected: true, lastSyncTime: null });
});

describe('useNetworkStore', () => {
  it('starts with isConnected true', () => {
    expect(useNetworkStore.getState().isConnected).toBe(true);
  });

  it('starts with lastSyncTime null', () => {
    expect(useNetworkStore.getState().lastSyncTime).toBeNull();
  });

  it('setConnected updates isConnected to false', () => {
    useNetworkStore.getState().setConnected(false);
    expect(useNetworkStore.getState().isConnected).toBe(false);
  });

  it('setConnected updates isConnected back to true', () => {
    useNetworkStore.getState().setConnected(false);
    useNetworkStore.getState().setConnected(true);
    expect(useNetworkStore.getState().isConnected).toBe(true);
  });

  it('setLastSyncTime updates lastSyncTime', () => {
    const time = '2025-01-01T00:00:00Z';
    useNetworkStore.getState().setLastSyncTime(time);
    expect(useNetworkStore.getState().lastSyncTime).toBe(time);
  });

  it('setLastSyncTime can be updated multiple times', () => {
    useNetworkStore.getState().setLastSyncTime('2025-01-01T10:00:00Z');
    useNetworkStore.getState().setLastSyncTime('2025-01-01T11:00:00Z');
    expect(useNetworkStore.getState().lastSyncTime).toBe('2025-01-01T11:00:00Z');
  });
});
