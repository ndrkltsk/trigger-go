import { getSecretApiClient } from './client';
import { ApiError } from '@/lib/errors';
import { getBaseUrl } from '@/stores/auth-store';
import { getSecretKeyForEnv } from '@/stores/secret-keys-store';
import { usePreferencesStore } from '@/stores/preferences-store';
import { MissingSecretKeyError } from '@/lib/errors';
import { metrics } from '@/services/sentry';
import type { operations } from './generated-types';

export type DeploymentDetail =
  operations['get_deployment_v1']['responses']['200']['content']['application/json'];

export type PromoteDeploymentResult =
  operations['promote_deployment_v1']['responses']['200']['content']['application/json'];

export interface DeploymentListItem {
  id: string;
  createdAt: string;
  shortCode: string;
  version: string;
  runtime: string | null;
  runtimeVersion: string | null;
  status: string;
  deployedAt: string | null;
  git: unknown;
  error: unknown;
}

export interface DeploymentListResponse {
  data: DeploymentListItem[];
  pagination: {
    next?: string;
  };
}

export async function listDeployments(cursor?: string): Promise<DeploymentListResponse> {
  const env = usePreferencesStore.getState().selectedEnvironment;
  const secretKey = getSecretKeyForEnv(env);

  if (!secretKey) {
    throw new MissingSecretKeyError(env);
  }

  const baseUrl = getBaseUrl();
  const params = new URLSearchParams();
  params.set('page[size]', '20');
  if (cursor) {
    params.set('page[after]', cursor);
  }

  const url = `${baseUrl}/api/v1/deployments?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  const body = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, { error: (body as any)?.error ?? 'Failed to fetch deployments' });
  }

  return body;
}

export async function retrieveDeployment(
  deploymentId: string
): Promise<DeploymentDetail> {
  const client = getSecretApiClient();
  const { data, error, response } = await client.GET(
    '/api/v1/deployments/{deploymentId}',
    {
      params: {
        path: { deploymentId },
      },
    }
  );

  if (error || !response.ok) {
    const message = (error as any)?.error ?? 'Failed to fetch deployment';
    throw new ApiError(response.status, { error: message });
  }

  return data!;
}

export async function promoteDeployment(
  version: string
): Promise<PromoteDeploymentResult> {
  metrics.count('api.deployments.promote', 1, { attributes: { version } });
  const client = getSecretApiClient();
  const { data, error, response } = await client.POST(
    '/api/v1/deployments/{version}/promote',
    {
      params: {
        path: { version },
      },
    }
  );

  if (error || !response.ok) {
    const message = (error as any)?.error ?? 'Failed to promote deployment';
    throw new ApiError(response.status, { error: message });
  }

  return data!;
}
