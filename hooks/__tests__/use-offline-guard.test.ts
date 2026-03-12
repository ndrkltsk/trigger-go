import { renderHook, act } from '@testing-library/react-native';
import { useOfflineGuard } from '@/hooks/use-offline-guard';
import { useNetworkStore } from '@/stores/network-store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockShowToast = jest.fn();
jest.mock('@/stores/toast-store', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

beforeEach(() => {
  useNetworkStore.setState({ isConnected: true, lastSyncTime: null });
  mockShowToast.mockClear();
});

describe('useOfflineGuard', () => {
  it('returns isOffline false when connected', () => {
    const { result } = renderHook(() => useOfflineGuard());
    expect(result.current.isOffline).toBe(false);
  });

  it('returns isOffline true when disconnected', () => {
    useNetworkStore.setState({ isConnected: false });
    const { result } = renderHook(() => useOfflineGuard());
    expect(result.current.isOffline).toBe(true);
  });

  it('executes action when online', () => {
    const action = jest.fn();
    const { result } = renderHook(() => useOfflineGuard());
    act(() => {
      result.current.guardAction(action);
    });
    expect(action).toHaveBeenCalledTimes(1);
    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it('blocks action and shows toast when offline', () => {
    useNetworkStore.setState({ isConnected: false });
    const action = jest.fn();
    const { result } = renderHook(() => useOfflineGuard());
    act(() => {
      result.current.guardAction(action);
    });
    expect(action).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'warning',
        title: 'You are offline',
      })
    );
  });
});
