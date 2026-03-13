import { listProjectRuns, type ListRunItem } from './runs';
import { listSchedules, type ScheduleObject } from './schedules';
import { listDeployments, type DeploymentListItem } from './deployments';
import { useAuthStore } from '@/stores/auth-store';
import { usePreferencesStore } from '@/stores/preferences-store';
import { metrics } from '@/services/sentry';

export interface DashboardStats {
  running: number;
  failed: number;
  completed: number;
  queued: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivity: ListRunItem[];
  nextSchedule: ScheduleObject | null;
  latestDeployment: DeploymentListItem | null;
}

const FAILED_STATUSES = ['FAILED', 'CRASHED', 'SYSTEM_FAILURE', 'TIMED_OUT'];
const RUNNING_STATUSES = ['EXECUTING', 'REATTEMPTING'];
const QUEUED_STATUSES = ['QUEUED', 'PENDING_VERSION', 'DELAYED', 'FROZEN'];

export async function getDashboardStats(): Promise<DashboardStats> {
  const { projectRef } = useAuthStore.getState();
  const { selectedEnvironment } = usePreferencesStore.getState();

  if (!projectRef) {
    return { running: 0, failed: 0, completed: 0, queued: 0 };
  }

  let running = 0;
  let failed = 0;
  let completed = 0;
  let queued = 0;
  let paginationLoops = 0;

  let after: string | undefined;
  const statsStart = Date.now();

  do {
    paginationLoops++;
    const result = await listProjectRuns(projectRef, {
      pageSize: 100,
      createdAtPeriod: '24h',
      after,
      env: [selectedEnvironment],
    });
    const runs = result.data ?? [];

    for (const run of runs) {
      if (RUNNING_STATUSES.includes(run.status)) running++;
      else if (FAILED_STATUSES.includes(run.status)) failed++;
      else if (run.status === 'COMPLETED') completed++;
      else if (QUEUED_STATUSES.includes(run.status)) queued++;
    }

    after = result.pagination?.next ?? undefined;
  } while (after);

  metrics.distribution('api.dashboard.stats.duration', Date.now() - statsStart, { unit: 'millisecond' });
  metrics.distribution('api.dashboard.stats.pagination_loops', paginationLoops);

  return { running, failed, completed, queued };
}

export async function getRecentActivity(): Promise<ListRunItem[]> {
  const { projectRef } = useAuthStore.getState();
  const { selectedEnvironment } = usePreferencesStore.getState();

  if (!projectRef) {
    return [];
  }

  const result = await listProjectRuns(projectRef, {
    pageSize: 20,
    env: [selectedEnvironment],
  });
  const runs = result.data ?? [];

  // Prioritize failures and active runs
  const failures = runs.filter((r) => FAILED_STATUSES.includes(r.status));
  const active = runs.filter((r) => RUNNING_STATUSES.includes(r.status));
  const rest = runs.filter(
    (r) => !FAILED_STATUSES.includes(r.status) && !RUNNING_STATUSES.includes(r.status)
  );

  return [...failures, ...active, ...rest].slice(0, 10);
}

export async function getNextScheduledRun(): Promise<ScheduleObject | null> {
  const result = await listSchedules({ perPage: 50 });
  const schedules = result.data ?? [];

  const active = schedules.filter((s) => s.active);
  if (active.length === 0) return null;

  // Find the one with the earliest nextRun
  const withNext = active.filter((s) => s.nextRun);
  if (withNext.length === 0) return active[0];

  withNext.sort((a, b) => {
    const aTime = new Date(a.nextRun!).getTime();
    const bTime = new Date(b.nextRun!).getTime();
    return aTime - bTime;
  });

  return withNext[0];
}

export async function getLatestDeploymentInfo(): Promise<DeploymentListItem | null> {
  const result = await listDeployments();
  return result.data[0] ?? null;
}
