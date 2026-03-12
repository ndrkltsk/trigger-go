import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchRuns, type ListRunItem } from '@/services/api/runs';
import { searchSchedules, type ScheduleObject } from '@/services/api/schedules';
import { useAuthStore } from '@/stores/auth-store';
import { usePreferencesStore } from '@/stores/preferences-store';
import { useTasksList } from '@/hooks/api/use-tasks';

interface GlobalSearchResult {
  runs: ListRunItem[];
  tasks: string[];
  schedules: ScheduleObject[];
  isLoading: boolean;
  isEmpty: boolean;
}

export function useGlobalSearch(query: string): GlobalSearchResult {
  const trimmedQuery = query.trim();
  const projectRef = useAuthStore((s) => s.projectRef);
  const selectedEnvironment = usePreferencesStore((s) => s.selectedEnvironment);
  const { tasks: workerTasks } = useTasksList();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['global-search', trimmedQuery, projectRef, selectedEnvironment],
    queryFn: async () => {
      const [runsResult, schedulesResult] = await Promise.allSettled([
        searchRuns(trimmedQuery, projectRef!, selectedEnvironment),
        searchSchedules(trimmedQuery),
      ]);
      return {
        runs: runsResult.status === 'fulfilled' ? runsResult.value : null,
        schedules: schedulesResult.status === 'fulfilled' ? schedulesResult.value : [],
      };
    },
    enabled: trimmedQuery.length >= 2 && !!projectRef,
    staleTime: 10_000,
  });

  const runs = data?.runs?.data ?? [];
  const schedules = data?.schedules ?? [];

  // Client-side task filtering from worker tasks list (finds tasks even without matching runs)
  const tasks = useMemo(() => {
    if (trimmedQuery.length < 2) return [];
    const lowerQuery = trimmedQuery.toLowerCase();
    return workerTasks
      .map((t) => t.slug)
      .filter((slug) => slug.toLowerCase().includes(lowerQuery));
  }, [trimmedQuery, workerTasks]);

  const isSearching = trimmedQuery.length >= 2;
  const isSearchLoading = isSearching && (isLoading || isFetching);
  const hasData = data !== undefined || tasks.length > 0;
  const isEmpty = isSearching && hasData && !isSearchLoading && runs.length === 0 && tasks.length === 0 && schedules.length === 0;

  return { runs, tasks, schedules, isLoading: isSearchLoading, isEmpty };
}
