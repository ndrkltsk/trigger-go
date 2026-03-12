import { computeHealthIndicator, fetchWidgetData } from '../widget-data-fetcher';
import { listProjectRuns } from '@/services/api/runs';
import { useAuthStore } from '@/stores/auth-store';
import { usePreferencesStore } from '@/stores/preferences-store';

jest.mock('@/services/api/runs');

const mockListProjectRuns = listProjectRuns as jest.MockedFunction<typeof listProjectRuns>;

beforeEach(() => {
  useAuthStore.setState({ projectRef: 'proj_test', token: 'tr_pat_test', isAuthenticated: true });
  usePreferencesStore.setState({ selectedEnvironment: 'dev' });
});

describe('computeHealthIndicator', () => {
  it('returns green for 0 failures', () => {
    expect(computeHealthIndicator(0)).toBe('green');
  });

  it('returns yellow for 1 failure', () => {
    expect(computeHealthIndicator(1)).toBe('yellow');
  });

  it('returns yellow for 5 failures', () => {
    expect(computeHealthIndicator(5)).toBe('yellow');
  });

  it('returns red for 6 failures', () => {
    expect(computeHealthIndicator(6)).toBe('red');
  });

  it('returns red for 100 failures', () => {
    expect(computeHealthIndicator(100)).toBe('red');
  });
});

describe('fetchWidgetData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns widget data with correct counts', async () => {
    mockListProjectRuns.mockResolvedValueOnce({
      data: [
        { status: 'EXECUTING' },
        { status: 'EXECUTING' },
        { status: 'FAILED' },
        { status: 'COMPLETED' },
        { status: 'QUEUED' },
        { status: 'DELAYED' },
      ],
    } as never);

    const result = await fetchWidgetData();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.activeCount).toBe(2);
      expect(result.data.failedCount).toBe(1);
      expect(result.data.queuedCount).toBe(2);
      expect(result.data.health).toBe('yellow');
      expect(result.data.lastUpdated).toBeInstanceOf(Date);
    }
  });

  it('returns green health for no failures', async () => {
    mockListProjectRuns.mockResolvedValueOnce({
      data: [
        { status: 'COMPLETED' },
        { status: 'EXECUTING' },
      ],
    } as never);

    const result = await fetchWidgetData();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.health).toBe('green');
    }
  });

  it('returns green with zero counts when no projectRef', async () => {
    useAuthStore.setState({ projectRef: null });

    const result = await fetchWidgetData();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.activeCount).toBe(0);
      expect(result.data.failedCount).toBe(0);
      expect(result.data.queuedCount).toBe(0);
      expect(result.data.health).toBe('green');
    }
  });

  it('handles empty data array', async () => {
    mockListProjectRuns.mockResolvedValueOnce({ data: [] } as never);

    const result = await fetchWidgetData();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.activeCount).toBe(0);
      expect(result.data.failedCount).toBe(0);
      expect(result.data.queuedCount).toBe(0);
      expect(result.data.health).toBe('green');
    }
  });

  it('returns auth error for 401 responses', async () => {
    mockListProjectRuns.mockRejectedValueOnce({ status: 401, message: 'Unauthorized' });

    const result = await fetchWidgetData();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('auth');
      expect(result.error.message).toBe('Sign in required');
    }
  });

  it('returns network error for network failures', async () => {
    mockListProjectRuns.mockRejectedValueOnce(new Error('Network request failed'));

    const result = await fetchWidgetData();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('network');
      expect(result.error.message).toBe('Unable to connect');
    }
  });
});
