import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { useProjectsStore } from '@/stores/projects-store';
import { fetchProjects, type Project, type SavedProject } from '@/services/api/projects';

export const projectKeys = {
  all: ['projects'] as const,
};

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: projectKeys.all,
    queryFn: fetchProjects,
    staleTime: 60_000,
  });
}

export function useSwitchProject() {
  const queryClient = useQueryClient();
  const switchProject = useAuthStore((s) => s.switchProject);

  return useMutation({
    mutationFn: async (projectRef: string) => {
      await switchProject(projectRef);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
