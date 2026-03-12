import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  getDashboardStats,
  getRecentActivity,
  getNextScheduledRun,
  getLatestDeploymentInfo,
  type DashboardStats,
} from '@/services/api/dashboard';
import type { ListRunItem } from '@/services/api/runs';
import type { ScheduleObject } from '@/services/api/schedules';
import type { DeploymentListItem } from '@/services/api/deployments';
import { usePreferencesStore } from '@/stores/preferences-store';
import { MissingSecretKeyError } from '@/lib/errors';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (env: string) => [...dashboardKeys.all, 'stats', env] as const,
  activity: (env: string) => [...dashboardKeys.all, 'activity', env] as const,
  nextSchedule: (env: string) => [...dashboardKeys.all, 'nextSchedule', env] as const,
  latestDeployment: (env: string) => [...dashboardKeys.all, 'latestDeployment', env] as const,
};

export function useDashboard() {
  const queryClient = useQueryClient();
  const environment = usePreferencesStore((s) => s.selectedEnvironment);

  const statsQuery = useQuery<DashboardStats>({
    queryKey: dashboardKeys.stats(environment),
    queryFn: getDashboardStats,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const activityQuery = useQuery<ListRunItem[]>({
    queryKey: dashboardKeys.activity(environment),
    queryFn: getRecentActivity,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const scheduleQuery = useQuery<ScheduleObject | null>({
    queryKey: dashboardKeys.nextSchedule(environment),
    queryFn: getNextScheduledRun,
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: (_count, error) => !(error instanceof MissingSecretKeyError),
  });

  const deploymentQuery = useQuery<DeploymentListItem | null>({
    queryKey: dashboardKeys.latestDeployment(environment),
    queryFn: getLatestDeploymentInfo,
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: (_count, error) => !(error instanceof MissingSecretKeyError),
  });

  const refetchAll = useCallback(() => {
    return Promise.all([
      statsQuery.refetch(),
      activityQuery.refetch(),
      scheduleQuery.refetch(),
      deploymentQuery.refetch(),
    ]);
  }, [statsQuery, activityQuery, scheduleQuery, deploymentQuery]);

  const isLoading =
    statsQuery.isLoading || activityQuery.isLoading;

  const isRefetching =
    statsQuery.isRefetching ||
    activityQuery.isRefetching ||
    scheduleQuery.isRefetching ||
    deploymentQuery.isRefetching;

  return {
    stats: statsQuery.data ?? { running: 0, failed: 0, completed: 0, queued: 0 },
    recentActivity: activityQuery.data ?? [],
    nextSchedule: scheduleQuery.data ?? null,
    latestDeployment: deploymentQuery.data ?? null,
    isLoading,
    isRefetching,
    isError: statsQuery.isError || activityQuery.isError,
    error: statsQuery.error || activityQuery.error,
    refetchAll,
  };
}
