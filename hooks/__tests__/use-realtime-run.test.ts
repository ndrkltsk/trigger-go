import { renderHook } from '@testing-library/react-native';
import { useRealtimeRun } from '@/hooks/use-realtime-run';
import { subscribeToRun } from '@/services/realtime/subscriptions';

const mockSetQueryData = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ setQueryData: mockSetQueryData }),
}));

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    token: 'tok_test',
    baseUrl: 'https://api.trigger.dev',
  }),
}));

jest.mock('@/lib/status-colors', () => ({
  isTerminalStatus: (s: string) => s === 'COMPLETED' || s === 'FAILED',
}));

const mockOnUpdate = jest.fn();
const mockOnError = jest.fn();
const mockClose = jest.fn();

jest.mock('@/services/realtime/subscriptions', () => ({
  subscribeToRun: jest.fn(() => ({
    onUpdate: mockOnUpdate,
    onError: mockOnError,
    close: mockClose,
  })),
}));

describe('useRealtimeRun', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('subscribes when enabled and token is present', () => {
    renderHook(() => useRealtimeRun('run_123', true));

    expect(subscribeToRun).toHaveBeenCalledWith(
      'run_123',
      'tok_test',
      'https://api.trigger.dev'
    );
  });

  it('does not subscribe when enabled is false', () => {
    renderHook(() => useRealtimeRun('run_123', false));

    expect(subscribeToRun).not.toHaveBeenCalled();
  });

  it('registers onUpdate and onError callbacks', () => {
    renderHook(() => useRealtimeRun('run_123', true));

    expect(mockOnUpdate).toHaveBeenCalledWith(expect.any(Function));
    expect(mockOnError).toHaveBeenCalledWith(expect.any(Function));
  });

  it('updates query cache when onUpdate fires with active status', () => {
    renderHook(() => useRealtimeRun('run_123', true));

    const updateCallback = mockOnUpdate.mock.calls[0][0];
    const updatedRun = { id: 'run_123', status: 'EXECUTING' };
    updateCallback(updatedRun);

    expect(mockSetQueryData).toHaveBeenCalledWith(
      ['runs', 'detail', 'run_123'],
      updatedRun
    );
  });

  it('closes connection when run reaches terminal state', () => {
    renderHook(() => useRealtimeRun('run_123', true));

    const updateCallback = mockOnUpdate.mock.calls[0][0];
    updateCallback({ id: 'run_123', status: 'COMPLETED' });

    expect(mockClose).toHaveBeenCalled();
  });

  it('closes connection on unmount', () => {
    const { unmount } = renderHook(() => useRealtimeRun('run_123', true));

    unmount();

    expect(mockClose).toHaveBeenCalled();
  });
});
