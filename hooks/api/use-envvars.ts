import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listEnvVars,
  createEnvVar,
  updateEnvVar,
  deleteEnvVar,
  importEnvVars,
  type EnvVar,
  type EnvType,
} from '@/services/api/envvars';
import { useAuthStore } from '@/stores/auth-store';
import { usePreferencesStore } from '@/stores/preferences-store';

export const envVarKeys = {
  all: ['envvars'] as const,
  lists: () => [...envVarKeys.all, 'list'] as const,
  list: (projectRef: string, env: string) =>
    [...envVarKeys.lists(), projectRef, env] as const,
  details: () => [...envVarKeys.all, 'detail'] as const,
  detail: (projectRef: string, env: string, name: string) =>
    [...envVarKeys.details(), projectRef, env, name] as const,
};

export function useEnvVars() {
  const projectRef = useAuthStore((s) => s.projectRef);
  const env = usePreferencesStore((s) => s.selectedEnvironment);

  return useQuery<EnvVar[]>({
    queryKey: envVarKeys.list(projectRef ?? '', env),
    queryFn: () => listEnvVars(projectRef!, env as EnvType),
    enabled: !!projectRef,
    staleTime: 60_000,
  });
}

export function useCreateEnvVar() {
  const queryClient = useQueryClient();
  const projectRef = useAuthStore((s) => s.projectRef);
  const env = usePreferencesStore((s) => s.selectedEnvironment);

  return useMutation({
    mutationFn: ({ name, value }: { name: string; value: string }) =>
      createEnvVar(projectRef!, env as EnvType, { name, value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: envVarKeys.lists() });
    },
  });
}

export function useUpdateEnvVar() {
  const queryClient = useQueryClient();
  const projectRef = useAuthStore((s) => s.projectRef);
  const env = usePreferencesStore((s) => s.selectedEnvironment);

  return useMutation({
    mutationFn: ({ name, value }: { name: string; value: string }) =>
      updateEnvVar(projectRef!, env as EnvType, name, value),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: envVarKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: envVarKeys.detail(projectRef!, env, variables.name),
      });
    },
  });
}

export function useDeleteEnvVar() {
  const queryClient = useQueryClient();
  const projectRef = useAuthStore((s) => s.projectRef);
  const env = usePreferencesStore((s) => s.selectedEnvironment);

  return useMutation({
    mutationFn: (name: string) => deleteEnvVar(projectRef!, env as EnvType, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: envVarKeys.lists() });
    },
  });
}

export function useImportEnvVars() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectRef,
      env,
      variables,
      override,
    }: {
      projectRef: string;
      env: EnvType;
      variables: EnvVar[];
      override?: boolean;
    }) => importEnvVars(projectRef, env, variables, override),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: envVarKeys.lists() });
    },
  });
}
