import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listSchedules, retrieveSchedule, activateSchedule, deactivateSchedule, deleteSchedule, createSchedule, updateSchedule, type ListSchedulesResult, type ScheduleObject, type CreateScheduleOptions, type UpdateScheduleOptions } from '@/services/api/schedules';
import { listTimezones } from '@/services/api/timezones';
import { MissingSecretKeyError } from '@/lib/errors';
import { usePreferencesStore } from '@/stores/preferences-store';

export const scheduleKeys = {
  all: ['schedules'] as const,
  lists: () => [...scheduleKeys.all, 'list'] as const,
  list: (environment: string) => [...scheduleKeys.lists(), { environment }] as const,
  details: () => [...scheduleKeys.all, 'detail'] as const,
  detail: (id: string) => [...scheduleKeys.details(), id] as const,
  timezones: () => ['timezones'] as const,
};

export function useSchedules() {
  const { selectedEnvironment } = usePreferencesStore();

  return useInfiniteQuery<ListSchedulesResult, Error>({
    queryKey: scheduleKeys.list(selectedEnvironment),
    queryFn: async ({ pageParam }) => {
      return listSchedules({
        page: pageParam as number,
        perPage: 25,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const current = lastPage.pagination?.currentPage ?? 1;
      const total = lastPage.pagination?.totalPages ?? 1;
      return current < total ? current + 1 : undefined;
    },
    staleTime: 30_000,
    retry: (_count, error) => !(error instanceof MissingSecretKeyError),
  });
}

export function useSchedule(scheduleId: string) {
  return useQuery<ScheduleObject>({
    queryKey: scheduleKeys.detail(scheduleId),
    queryFn: () => retrieveSchedule(scheduleId),
    enabled: !!scheduleId,
    staleTime: 30_000,
    retry: (_count, error) => !(error instanceof MissingSecretKeyError),
  });
}

export function useToggleScheduleActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ scheduleId, active }: { scheduleId: string; active: boolean }) =>
      active ? deactivateSchedule(scheduleId) : activateSchedule(scheduleId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(variables.scheduleId) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scheduleId: string) => deleteSchedule(scheduleId),
    onSuccess: (_data, scheduleId) => {
      queryClient.removeQueries({ queryKey: scheduleKeys.detail(scheduleId) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
    },
  });
}

export function useTimezones() {
  return useQuery<string[]>({
    queryKey: scheduleKeys.timezones(),
    queryFn: listTimezones,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: CreateScheduleOptions) => createSchedule(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ scheduleId, options }: { scheduleId: string; options: UpdateScheduleOptions }) =>
      updateSchedule(scheduleId, options),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(variables.scheduleId) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
    },
  });
}
