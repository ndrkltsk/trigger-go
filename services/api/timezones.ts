import { getApiClient } from './client';
import { ApiError } from '@/lib/errors';

export async function listTimezones(): Promise<string[]> {
  const client = getApiClient();
  const { data, error, response } = await client.GET('/api/v1/timezones');

  if (error || !response.ok) {
    const message = (error as any)?.error ?? 'Failed to fetch timezones';
    throw new ApiError(response.status, { error: message });
  }

  return data?.timezones ?? [];
}
