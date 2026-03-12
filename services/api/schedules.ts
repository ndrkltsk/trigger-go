import { getSecretApiClient } from './client';
import { ApiError } from '@/lib/errors';
import type { components } from './generated-types';

export type ScheduleObject = components['schemas']['ScheduleObject'];
export type ListSchedulesResult = components['schemas']['ListSchedulesResult'];
export type CreateScheduleOptions = components['schemas']['CreateScheduleOptions'];
export type UpdateScheduleOptions = components['schemas']['UpdateScheduleOptions'];

export interface ListSchedulesParams {
  page?: number;
  perPage?: number;
}

export async function listSchedules(
  params: ListSchedulesParams = {}
): Promise<ListSchedulesResult> {
  const client = getSecretApiClient();
  const { data, error, response } = await client.GET('/api/v1/schedules', {
    params: {
      query: {
        page: params.page,
        perPage: params.perPage,
      },
    },
  });

  if (error || !response.ok) {
    const message = (error as any)?.error ?? 'Failed to fetch schedules';
    throw new ApiError(response.status, { error: message });
  }

  return data!;
}

export async function retrieveSchedule(
  scheduleId: string
): Promise<ScheduleObject> {
  const client = getSecretApiClient();
  const { data, error, response } = await client.GET(
    '/api/v1/schedules/{schedule_id}',
    {
      params: {
        path: { schedule_id: scheduleId },
      },
    }
  );

  if (error || !response.ok) {
    const message = (error as any)?.error ?? 'Failed to fetch schedule';
    throw new ApiError(response.status, { error: message });
  }

  return data!;
}

export async function activateSchedule(
  scheduleId: string
): Promise<ScheduleObject> {
  const client = getSecretApiClient();
  const { data, error, response } = await client.POST(
    '/api/v1/schedules/{schedule_id}/activate',
    {
      params: {
        path: { schedule_id: scheduleId },
      },
    }
  );

  if (error || !response.ok) {
    const message = (error as any)?.error ?? 'Failed to activate schedule';
    throw new ApiError(response.status, { error: message });
  }

  return data!;
}

export async function createSchedule(
  options: CreateScheduleOptions
): Promise<ScheduleObject> {
  const client = getSecretApiClient();
  const { data, error, response } = await client.POST('/api/v1/schedules', {
    body: options,
  });

  if (error || !response.ok) {
    const message = (error as any)?.error ?? 'Failed to create schedule';
    throw new ApiError(response.status, error ?? { error: message });
  }

  return data!;
}

export async function updateSchedule(
  scheduleId: string,
  options: UpdateScheduleOptions
): Promise<ScheduleObject> {
  const client = getSecretApiClient();
  const { data, error, response } = await client.PUT(
    '/api/v1/schedules/{schedule_id}',
    {
      params: { path: { schedule_id: scheduleId } },
      body: options,
    }
  );

  if (error || !response.ok) {
    const message = (error as any)?.error ?? 'Failed to update schedule';
    throw new ApiError(response.status, error ?? { error: message });
  }

  return data!;
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  const client = getSecretApiClient();
  const { error, response } = await client.DELETE(
    '/api/v1/schedules/{schedule_id}',
    {
      params: {
        path: { schedule_id: scheduleId },
      },
    }
  );

  if (error || !response.ok) {
    const message = (error as any)?.error ?? 'Failed to delete schedule';
    throw new ApiError(response.status, { error: message });
  }
}

export async function deactivateSchedule(
  scheduleId: string
): Promise<ScheduleObject> {
  const client = getSecretApiClient();
  const { data, error, response } = await client.POST(
    '/api/v1/schedules/{schedule_id}/deactivate',
    {
      params: {
        path: { schedule_id: scheduleId },
      },
    }
  );

  if (error || !response.ok) {
    const message = (error as any)?.error ?? 'Failed to deactivate schedule';
    throw new ApiError(response.status, { error: message });
  }

  return data!;
}

export async function searchSchedules(query: string): Promise<ScheduleObject[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const result = await listSchedules({ perPage: 50 });
  const schedules = result.data ?? [];

  return schedules
    .filter((s) => {
      const schedId = (s.id ?? '').toLowerCase();
      const extId = (s.externalId ?? '').toLowerCase();
      const task = (s.task ?? '').toLowerCase();
      return schedId.includes(trimmed) || extId.includes(trimmed) || task.includes(trimmed);
    })
    .slice(0, 10);
}
