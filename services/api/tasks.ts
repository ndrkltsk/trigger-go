import { getApiClient, getJwtApiClient } from './client';
import { ApiError } from '@/lib/errors';
import { getAuthToken, getBaseUrl, useAuthStore } from '@/stores/auth-store';
import { metrics } from '@/services/sentry';
import type { components } from './generated-types';

export type TriggerTaskRequestBody = components['schemas']['TriggerTaskRequestBody'];
export type TriggerTaskResponse = components['schemas']['TriggerTaskResponse'];
export type BatchTriggerTaskResponse = components['schemas']['BatchTriggerTaskResponse'];
export type BatchTriggerTaskRequestBodyItem = components['schemas']['BatchTriggerTaskRequestBodyItem'];

// --- Worker Tasks API (internal/undocumented) ---

export interface WorkerTask {
  id: string;
  slug: string;
  filePath: string;
  triggerSource: string;
  createdAt: string;
  payloadSchema?: Record<string, unknown>;
}

export interface WorkerInfo {
  id: string;
  version: string;
  engine: string;
  sdkVersion: string;
  cliVersion: string;
  tasks: WorkerTask[];
}

export interface WorkerResponse {
  worker: WorkerInfo;
  urls?: {
    runs?: string;
  };
}

export async function fetchWorkerTasks(
  projectRef: string,
  environment: string,
): Promise<WorkerResponse> {
  const baseUrl = getBaseUrl();
  const token = getAuthToken();

  const url = `${baseUrl}/api/v1/projects/${projectRef}/${environment}/workers/current`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Failed to fetch worker tasks' }));
    throw new ApiError(response.status, {
      error: body.error ?? `Failed to fetch worker tasks (${response.status})`,
    });
  }

  return response.json();
}

export interface TriggerTaskParams {
  payload?: unknown;
  options?: TriggerTaskRequestBody['options'];
}

export async function triggerTask(
  taskIdentifier: string,
  params: TriggerTaskParams = {}
): Promise<TriggerTaskResponse> {
  metrics.count('api.tasks.trigger', 1, { attributes: { task: taskIdentifier } });
  const client = await getJwtApiClient();

  const body: TriggerTaskRequestBody = {
    payload: params.payload,
    options: params.options,
  };

  const { data, error, response } = await client.POST(
    '/api/v1/tasks/{taskIdentifier}/trigger',
    {
      params: { path: { taskIdentifier } },
      body,
    }
  );

  if (error || !response.ok) {
    const message = (error as { error?: string })?.error ?? 'Failed to trigger task';
    throw new ApiError(response.status, { error: message });
  }

  return data!;
}

export async function batchTriggerTasks(
  items: BatchTriggerTaskRequestBodyItem[]
): Promise<BatchTriggerTaskResponse> {
  metrics.count('api.tasks.batch_trigger', 1);
  metrics.distribution('api.tasks.batch_trigger.size', items.length);
  const client = getApiClient();

  const { data, error, response } = await client.POST('/api/v1/tasks/batch', {
    body: { items },
  });

  if (error || !response.ok) {
    const message = (error as { error?: string })?.error ?? 'Failed to batch trigger tasks';
    throw new ApiError(response.status, { error: message });
  }

  return data!;
}
