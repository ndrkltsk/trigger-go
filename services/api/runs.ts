import { getApiClient, getJwtApiClient, jwtFetch } from './client';
import { ApiError } from '@/lib/errors';
import { Sentry, metrics } from '@/services/sentry';
import { posthogCapture } from '@/services/posthog';
import type { components } from './generated-types';

export type ListRunItem = components['schemas']['ListRunItem'];
export type ListRunsResult = components['schemas']['ListRunsResult'];
export type RetrieveRunResponse = components['schemas']['RetrieveRunResponse'];
export type SerializedError = components['schemas']['SerializedError'];
export type CommonRunObject = components['schemas']['CommonRunObject'];

// --- Trace API types (not in OpenAPI spec) ---

export interface SpanEvent {
  name: string;
  time: string;
  properties?: Record<string, unknown>;
}

export interface SpanData {
  message: string;
  startTime: string;
  duration: number;
  isError: boolean;
  isPartial: boolean;
  isCancelled: boolean;
  level: string;
  attemptNumber?: number;
  events: SpanEvent[];
  properties?: Record<string, unknown>;
}

export interface SpanSummary {
  id: string;
  parentId: string | null;
  runId: string;
  data: SpanData;
  children: SpanSummary[];
}

export interface TraceResponse {
  trace: {
    traceId: string;
    rootSpan: SpanSummary;
  };
}

export interface RunsListParams {
  status?: string[];
  taskIdentifier?: string[];
  tags?: string[];
  version?: string;
  bulkAction?: string;
  schedule?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  createdAtPeriod?: string;
  pageSize?: number;
  after?: string;
  before?: string;
}

function buildQuery(params: RunsListParams) {
  const query: Record<string, unknown> = {};

  const page: Record<string, unknown> = {};
  if (params.pageSize) page.size = params.pageSize;
  if (params.after) page.after = params.after;
  if (params.before) page.before = params.before;
  if (Object.keys(page).length > 0) query.page = page;

  const filter: Record<string, unknown> = {};
  if (params.status?.length) filter.status = params.status;
  if (params.taskIdentifier?.length) filter.taskIdentifier = params.taskIdentifier;
  if (params.tags?.length) filter.tag = params.tags;
  if (params.version) filter.version = [params.version];
  if (params.bulkAction) filter.bulkAction = params.bulkAction;
  if (params.schedule) filter.schedule = params.schedule;

  if (params.createdAtFrom || params.createdAtTo || params.createdAtPeriod) {
    const createdAt: Record<string, string> = {};
    if (params.createdAtFrom) createdAt.from = params.createdAtFrom;
    if (params.createdAtTo) createdAt.to = params.createdAtTo;
    if (params.createdAtPeriod) createdAt.period = params.createdAtPeriod;
    filter.createdAt = createdAt;
  }

  if (Object.keys(filter).length > 0) query.filter = filter;

  return query;
}

export async function listRuns(params: RunsListParams = {}): Promise<ListRunsResult> {
  const client = getApiClient();
  const { data, error, response } = await client.GET('/api/v1/runs', {
    params: { query: buildQuery(params) as never },
  });

  if (error || !response.ok) {
    throw new ApiError(response.status, error ?? { error: 'Failed to fetch runs' });
  }

  return data!;
}

export async function listProjectRuns(
  projectRef: string,
  params: RunsListParams & { env?: string[] } = {}
): Promise<ListRunsResult> {
  const client = getApiClient();

  const query = buildQuery(params);
  if (params.env?.length) {
    const filter = (query.filter ?? {}) as Record<string, unknown>;
    filter.env = params.env;
    query.filter = filter;
  }

  const { data, error, response } = await client.GET('/api/v1/projects/{projectRef}/runs', {
    params: {
      path: { projectRef },
      query: query as never,
    },
  });

  if (error || !response.ok) {
    throw new ApiError(response.status, error ?? { error: 'Failed to fetch project runs' });
  }

  return data!;
}

export async function retrieveRun(runId: string): Promise<RetrieveRunResponse> {
  const client = await getJwtApiClient();
  const { data, error, response } = await client.GET('/api/v3/runs/{runId}', {
    params: { path: { runId } },
  });

  if (error || !response.ok) {
    const message = (error as { error?: string })?.error ?? 'Failed to fetch run details';
    throw new ApiError(response.status, { error: message });
  }

  return data!;
}

export async function rescheduleRun(
  runId: string,
  delay: string
): Promise<RetrieveRunResponse> {
  metrics.count('api.runs.reschedule', 1);
  Sentry.logger.info(Sentry.logger.fmt`Rescheduling run ${runId} with delay ${delay}`);
  posthogCapture('run rescheduled', { run_id: runId, delay });
  const client = await getJwtApiClient();
  const { data, error, response } = await client.POST(
    '/api/v1/runs/{runId}/reschedule',
    {
      params: { path: { runId } },
      body: { delay },
    }
  );

  if (error || !response.ok) {
    const message = (error as any)?.error ?? 'Failed to reschedule run';
    throw new ApiError(response.status, { error: message });
  }

  return data!;
}

export async function cancelRun(runId: string): Promise<{ id?: string }> {
  metrics.count('api.runs.cancel', 1);
  Sentry.logger.info(Sentry.logger.fmt`Cancelling run ${runId}`);
  posthogCapture('run canceled', { run_id: runId });
  const client = await getJwtApiClient();
  const { data, error, response } = await client.POST('/api/v2/runs/{runId}/cancel', {
    params: { path: { runId } },
  });

  if (error || !response.ok) {
    const message = (error as any)?.error ?? 'Failed to cancel run';
    throw new ApiError(response.status, { error: message });
  }

  return data!;
}

export async function replayRun(
  taskIdentifier: string,
  payload: unknown
): Promise<{ id?: string }> {
  metrics.count('api.runs.replay', 1);
  Sentry.logger.info(Sentry.logger.fmt`Replaying task ${taskIdentifier}`);
  posthogCapture('run replayed', { task_identifier: taskIdentifier });
  const client = await getJwtApiClient();
  const { data, error, response } = await client.POST(
    '/api/v1/tasks/{taskIdentifier}/trigger',
    {
      params: { path: { taskIdentifier } },
      body: { payload } as never,
    }
  );

  if (error || !response.ok) {
    const message = (error as any)?.error ?? 'Failed to replay run';
    throw new ApiError(response.status, { error: message });
  }

  return data!;
}

export async function updateRunMetadata(
  runId: string,
  metadata: Record<string, unknown>
): Promise<{ metadata?: Record<string, unknown> }> {
  metrics.count('api.runs.metadata_update', 1);
  posthogCapture('run metadata_updated', { run_id: runId });
  const client = await getJwtApiClient();
  const { data, error, response } = await client.PUT('/api/v1/runs/{runId}/metadata', {
    params: { path: { runId } },
    body: { metadata } as never,
  });

  if (error || !response.ok) {
    const message = (error as { error?: string })?.error ?? 'Failed to update metadata';
    throw new ApiError(response.status, { error: message });
  }

  return data!;
}

export async function fetchRunTrace(runId: string): Promise<TraceResponse> {
  posthogCapture('run trace_viewed', { run_id: runId });
  const response = await jwtFetch(`/api/v1/runs/${encodeURIComponent(runId)}/trace`);

  if (!response.ok) {
    throw new ApiError(response.status, { error: 'Failed to fetch run trace' });
  }

  return response.json();
}

export async function searchRuns(query: string, projectRef: string, env: string): Promise<ListRunsResult> {
  const trimmed = query.trim();
  if (!trimmed) return { data: [] } as unknown as ListRunsResult;

  metrics.count('api.runs.search', 1, { attributes: { env } });
  posthogCapture('runs searched', { environment: env });

  // Tag search
  if (trimmed.startsWith('#') || trimmed.startsWith('tag:')) {
    const tag = trimmed.replace(/^(#|tag:)/, '').trim();
    return listProjectRuns(projectRef, { tags: [tag], pageSize: 10, env: [env] });
  }

  // Try run ID lookup AND task identifier search in parallel.
  // Run IDs may or may not have the "run_" prefix, so try both forms.
  const runId = trimmed.startsWith('run_') ? trimmed : `run_${trimmed}`;

  const [runById, runsByTask] = await Promise.allSettled([
    retrieveRun(runId),
    listProjectRuns(projectRef, { taskIdentifier: [trimmed], pageSize: 10, env: [env] }),
  ]);

  const results: ListRunItem[] = [];

  if (runById.status === 'fulfilled') {
    const run = runById.value;
    results.push({
      id: run.id,
      status: run.status,
      taskIdentifier: run.taskIdentifier,
      version: run.version,
      createdAt: run.createdAt as unknown as string,
      updatedAt: run.updatedAt as unknown as string,
      tags: run.tags ?? [],
    } as ListRunItem);
  }

  if (runsByTask.status === 'fulfilled') {
    for (const run of runsByTask.value.data ?? []) {
      if (!results.some((r) => r.id === run.id)) {
        results.push(run);
      }
    }
  }

  return { data: results } as ListRunsResult;
}
