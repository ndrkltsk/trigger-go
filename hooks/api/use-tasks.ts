import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  triggerTask,
  batchTriggerTasks,
  fetchWorkerTasks,
  type TriggerTaskParams,
  type TriggerTaskResponse,
  type BatchTriggerTaskResponse,
  type BatchTriggerTaskRequestBodyItem,
  type WorkerResponse,
} from '@/services/api/tasks';
import { useAuthStore } from '@/stores/auth-store';
import { useEnvironment } from '@/hooks/use-environment';
import { runKeys } from './use-runs';

export const taskKeys = {
  all: ['tasks'] as const,
  worker: (projectRef: string, env: string) =>
    ['tasks', 'worker', projectRef, env] as const,
};

export interface TaskListItem {
  id: string;
  slug: string;
  filePath: string;
  exportName?: string;
  triggerSource?: string;
  createdAt?: string;
  payloadSchema?: Record<string, unknown>;
}

/**
 * Primary hook for listing tasks. Uses the Workers API endpoint which works with PAT auth.
 * GET /api/v1/projects/{projectRef}/{env}/workers/current
 */
export function useTasksList() {
  const { projectRef } = useAuthStore();
  const { currentEnvironment } = useEnvironment();

  const workerQuery = useQuery<WorkerResponse>({
    queryKey: taskKeys.worker(projectRef ?? '', currentEnvironment),
    queryFn: () => fetchWorkerTasks(projectRef!, currentEnvironment),
    enabled: !!projectRef,
    staleTime: 60_000,
  });

  const workerTasks = workerQuery.data?.worker?.tasks ?? [];

  const tasks: TaskListItem[] = workerTasks.map((t) => ({
    id: t.id,
    slug: t.slug,
    filePath: t.filePath,
    triggerSource: t.triggerSource,
    createdAt: t.createdAt,
    payloadSchema: t.payloadSchema,
  }));

  return {
    tasks,
    workerInfo: workerQuery.data?.worker,
    isLoading: workerQuery.isLoading,
    isError: workerQuery.isError,
    error: workerQuery.error,
    refetch: workerQuery.refetch,
    deploymentVersion: workerQuery.data?.worker?.version,
  };
}

export function useWorkerTasks() {
  const { projectRef } = useAuthStore();
  const { currentEnvironment } = useEnvironment();

  return useQuery<WorkerResponse>({
    queryKey: taskKeys.worker(projectRef ?? '', currentEnvironment),
    queryFn: () => fetchWorkerTasks(projectRef!, currentEnvironment),
    enabled: !!projectRef,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useTriggerTask() {
  const queryClient = useQueryClient();

  return useMutation<
    TriggerTaskResponse,
    Error,
    { taskIdentifier: string; params: TriggerTaskParams }
  >({
    mutationFn: ({ taskIdentifier, params }) => triggerTask(taskIdentifier, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: runKeys.lists() });
    },
  });
}

export function useBatchTrigger() {
  const queryClient = useQueryClient();

  return useMutation<
    BatchTriggerTaskResponse,
    Error,
    { items: BatchTriggerTaskRequestBodyItem[] }
  >({
    mutationFn: ({ items }) => batchTriggerTasks(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: runKeys.lists() });
    },
  });
}
