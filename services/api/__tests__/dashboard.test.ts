import {
  getDashboardStats,
  getRecentActivity,
  getNextScheduledRun,
  getLatestDeploymentInfo,
} from '@/services/api/dashboard';
import * as runsApi from '@/services/api/runs';
import * as schedulesApi from '@/services/api/schedules';
import * as deploymentsApi from '@/services/api/deployments';
import { useAuthStore } from '@/stores/auth-store';
import { usePreferencesStore } from '@/stores/preferences-store';

jest.mock('@/services/api/runs');
jest.mock('@/services/api/schedules');
jest.mock('@/services/api/deployments');

const mockListProjectRuns = runsApi.listProjectRuns as jest.MockedFunction<typeof runsApi.listProjectRuns>;
const mockListSchedules = schedulesApi.listSchedules as jest.MockedFunction<typeof schedulesApi.listSchedules>;
const mockListDeployments = deploymentsApi.listDeployments as jest.MockedFunction<typeof deploymentsApi.listDeployments>;

beforeEach(() => {
  useAuthStore.setState({ projectRef: 'proj_test', token: 'tr_pat_test', isAuthenticated: true });
  usePreferencesStore.setState({ selectedEnvironment: 'dev' });
});

describe('getDashboardStats', () => {
  it('counts runs by status category', async () => {
    mockListProjectRuns.mockResolvedValue({
      data: [
        { id: '1', status: 'EXECUTING', taskIdentifier: 't1', createdAt: '' },
        { id: '2', status: 'FAILED', taskIdentifier: 't2', createdAt: '' },
        { id: '3', status: 'COMPLETED', taskIdentifier: 't3', createdAt: '' },
        { id: '4', status: 'QUEUED', taskIdentifier: 't4', createdAt: '' },
        { id: '5', status: 'CRASHED', taskIdentifier: 't5', createdAt: '' },
        { id: '6', status: 'REATTEMPTING', taskIdentifier: 't6', createdAt: '' },
      ],
    } as any);

    const stats = await getDashboardStats();
    expect(stats.running).toBe(2); // EXECUTING + REATTEMPTING
    expect(stats.failed).toBe(2); // FAILED + CRASHED
    expect(stats.completed).toBe(1);
    expect(stats.queued).toBe(1);
  });

  it('returns zeros when no projectRef', async () => {
    useAuthStore.setState({ projectRef: null });
    const stats = await getDashboardStats();
    expect(stats).toEqual({ running: 0, failed: 0, completed: 0, queued: 0 });
  });
});

describe('getRecentActivity', () => {
  it('prioritizes failures and active runs', async () => {
    mockListProjectRuns.mockResolvedValue({
      data: [
        { id: '1', status: 'COMPLETED', taskIdentifier: 't1', createdAt: '' },
        { id: '2', status: 'FAILED', taskIdentifier: 't2', createdAt: '' },
        { id: '3', status: 'EXECUTING', taskIdentifier: 't3', createdAt: '' },
        { id: '4', status: 'QUEUED', taskIdentifier: 't4', createdAt: '' },
      ],
    } as any);

    const activity = await getRecentActivity();
    expect(activity[0].id).toBe('2'); // failed first
    expect(activity[1].id).toBe('3'); // active second
    expect(activity[2].id).toBe('1'); // completed after
    expect(activity[3].id).toBe('4'); // queued last
  });

  it('limits to 10 items', async () => {
    const runs = Array.from({ length: 20 }, (_, i) => ({
      id: `run-${i}`,
      status: 'COMPLETED',
      taskIdentifier: `t${i}`,
      createdAt: '',
    }));
    mockListProjectRuns.mockResolvedValue({ data: runs } as any);

    const activity = await getRecentActivity();
    expect(activity).toHaveLength(10);
  });

  it('returns empty array when no projectRef', async () => {
    useAuthStore.setState({ projectRef: null });
    const activity = await getRecentActivity();
    expect(activity).toEqual([]);
  });
});

describe('getNextScheduledRun', () => {
  it('returns the schedule with the earliest nextRun', async () => {
    mockListSchedules.mockResolvedValue({
      data: [
        { id: 's1', active: true, nextRun: '2025-06-01T12:00:00Z', task: 'task-a' },
        { id: 's2', active: true, nextRun: '2025-06-01T10:00:00Z', task: 'task-b' },
        { id: 's3', active: false, nextRun: '2025-06-01T08:00:00Z', task: 'task-c' },
      ],
    } as any);

    const next = await getNextScheduledRun();
    expect(next?.id).toBe('s2'); // earliest active
  });

  it('returns null when no active schedules', async () => {
    mockListSchedules.mockResolvedValue({
      data: [
        { id: 's1', active: false, task: 'task-a' },
      ],
    } as any);

    const next = await getNextScheduledRun();
    expect(next).toBeNull();
  });

  it('returns null on API error', async () => {
    mockListSchedules.mockRejectedValue(new Error('API error'));
    const next = await getNextScheduledRun();
    expect(next).toBeNull();
  });
});

describe('getLatestDeploymentInfo', () => {
  it('returns deployment data', async () => {
    const deployment = { id: 'd1', version: '20250601.1', status: 'DEPLOYED' };
    mockListDeployments.mockResolvedValue({ data: [deployment], pagination: {} } as any);

    const result = await getLatestDeploymentInfo();
    expect(result).toEqual(deployment);
  });

  it('returns null on API error', async () => {
    mockListDeployments.mockRejectedValue(new Error('Not found'));
    const result = await getLatestDeploymentInfo();
    expect(result).toBeNull();
  });
});
