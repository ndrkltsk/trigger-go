import { useInfiniteQuery } from '@tanstack/react-query';
import { listProjectRuns, type ListRunsResult } from '@/services/api/runs';
import { useAuthStore } from '@/stores/auth-store';
import { useEnvironment } from '@/hooks/use-environment';
import { runKeys } from './use-runs';

export const taskRunKeys = {
  list: (taskId: string, env: string) =>
    [...runKeys.lists(), 'task', taskId, env] as const,
};

/**
 * Fetches recent runs for a specific task identifier.
 * Uses the project runs endpoint with a taskIdentifier filter.
 */
export function useTaskRuns(taskIdentifier: string) {
  const { projectRef } = useAuthStore();
  const { currentEnvironment } = useEnvironment();

  return useInfiniteQuery({
    queryKey: taskRunKeys.list(taskIdentifier, currentEnvironment),
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      return listProjectRuns(projectRef!, {
        taskIdentifier: [taskIdentifier],
        env: [currentEnvironment],
        pageSize: 100,
        after: pageParam,
        createdAtFrom: new Date(0).toISOString(),
        createdAtTo: new Date().toISOString(),
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: ListRunsResult) =>
      lastPage.pagination?.next ?? undefined,
    enabled: !!projectRef && !!taskIdentifier,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}
