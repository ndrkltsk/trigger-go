import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listDeployments,
  retrieveDeployment,
  promoteDeployment,
  type DeploymentListResponse,
  type DeploymentDetail,
} from '@/services/api/deployments';
import { MissingSecretKeyError } from '@/lib/errors';
import { usePreferencesStore } from '@/stores/preferences-store';

export const deploymentKeys = {
  all: ['deployments'] as const,
  list: (environment: string) => [...deploymentKeys.all, 'list', { environment }] as const,
  details: () => [...deploymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...deploymentKeys.details(), id] as const,
};

export function useDeployments() {
  const { selectedEnvironment } = usePreferencesStore();

  return useQuery<DeploymentListResponse>({
    queryKey: deploymentKeys.list(selectedEnvironment),
    queryFn: () => listDeployments(),
    enabled: selectedEnvironment !== 'dev',
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: (count, error) => {
      if (error instanceof MissingSecretKeyError) return false;
      return count < 2;
    },
  });
}

export function useDeployment(deploymentId: string) {
  return useQuery<DeploymentDetail>({
    queryKey: deploymentKeys.detail(deploymentId),
    queryFn: () => retrieveDeployment(deploymentId),
    enabled: !!deploymentId,
    staleTime: 30_000,
    retry: (count, error) => {
      if (error instanceof MissingSecretKeyError) return false;
      return count < 2;
    },
  });
}

export function usePromoteDeployment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (version: string) => promoteDeployment(version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deploymentKeys.all });
    },
  });
}
