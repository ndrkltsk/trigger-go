import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listProjectRuns, rescheduleRun, cancelRun, replayRun, retrieveRun, updateRunMetadata, fetchRunTrace, type ListRunsResult, type RunsListParams, type RetrieveRunResponse, type TraceResponse } from '@/services/api/runs';
import { useAuthStore } from '@/stores/auth-store';
import { usePreferencesStore } from '@/stores/preferences-store';
import { useFiltersStore } from '@/stores/filters-store';
import { isTerminalStatus } from '@/lib/status-colors';

export const runKeys = {
  all: ['runs'] as const,
  lists: () => [...runKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>, environment: string) =>
    [...runKeys.lists(), { filters, environment }] as const,
  details: () => [...runKeys.all, 'detail'] as const,
  detail: (id: string) => [...runKeys.details(), id] as const,
  trace: (id: string) => [...runKeys.all, 'trace', id] as const,
};

export function useRuns() {
  const { projectRef } = useAuthStore();
  const { selectedEnvironment } = usePreferencesStore();
  const {
    statusFilter,
    taskFilter,
    tagFilter,
    periodFilter,
    createdAtFrom,
    createdAtTo,
    versionFilter,
    batchFilter,
    scheduleFilter,
  } = useFiltersStore();

  const filterState = {
    statusFilter,
    taskFilter,
    tagFilter,
    periodFilter,
    versionFilter,
    batchFilter,
    scheduleFilter,
  };

  return useInfiniteQuery({
    queryKey: runKeys.list(filterState, selectedEnvironment),
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const effectiveFrom = createdAtFrom ?? new Date(0).toISOString();
      const effectiveTo = createdAtTo ?? new Date().toISOString();

      const params: RunsListParams = {
        pageSize: 25,
        after: pageParam,
        status: statusFilter.length > 0 ? statusFilter : undefined,
        taskIdentifier: taskFilter.length > 0 ? taskFilter : undefined,
        tags: tagFilter.length > 0 ? tagFilter : undefined,
        version: versionFilter ?? undefined,
        bulkAction: batchFilter ?? undefined,
        schedule: scheduleFilter ?? undefined,
        createdAtFrom: effectiveFrom,
        createdAtTo: effectiveTo,
      };

      return listProjectRuns(projectRef!, {
        ...params,
        env: [selectedEnvironment],
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: ListRunsResult) => lastPage.pagination?.next ?? undefined,
    enabled: !!projectRef,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}

export function useRun(runId: string) {
  return useQuery<RetrieveRunResponse>({
    queryKey: runKeys.detail(runId),
    queryFn: () => retrieveRun(runId),
    enabled: !!runId,
    staleTime: 3_000,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && isTerminalStatus(status)) return false;
      return 5_000;
    },
  });
}

export function useRunTrace(runId: string, runStatus?: string) {
  const isTerminal = runStatus ? isTerminalStatus(runStatus) : false;

  return useQuery<TraceResponse>({
    queryKey: runKeys.trace(runId),
    queryFn: () => fetchRunTrace(runId),
    enabled: !!runId,
    staleTime: 10_000,
    refetchInterval: isTerminal ? false : 10_000,
  });
}

export function useCancelRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (runId: string) => cancelRun(runId),
    onSuccess: (_data, runId) => {
      queryClient.invalidateQueries({ queryKey: runKeys.detail(runId) });
      queryClient.invalidateQueries({ queryKey: runKeys.lists() });
    },
  });
}

export function useReplayRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskIdentifier, payload }: { taskIdentifier: string; payload: unknown }) =>
      replayRun(taskIdentifier, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: runKeys.lists() });
    },
  });
}

export function useRescheduleRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ runId, delay }: { runId: string; delay: string }) =>
      rescheduleRun(runId, delay),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: runKeys.detail(variables.runId) });
      queryClient.invalidateQueries({ queryKey: runKeys.lists() });
    },
  });
}

export function useUpdateRunMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ runId, metadata }: { runId: string; metadata: Record<string, unknown> }) =>
      updateRunMetadata(runId, metadata),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: runKeys.detail(variables.runId) });
    },
  });
}
