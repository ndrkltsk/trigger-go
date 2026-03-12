import { getApiClient } from './client';
import { ApiError } from '@/lib/errors';
import type { components } from './generated-types';

export type EnvVar = components['schemas']['EnvVar'];
export type EnvVarValue = components['schemas']['EnvVarValue'];
export type EnvType = components['parameters']['env'];

export interface ImportEnvVarsResult {
  success: boolean;
}

export async function listEnvVars(
  projectRef: string,
  env: EnvType
): Promise<EnvVar[]> {
  const client = getApiClient();
  const { data, error, response } = await client.GET(
    '/api/v1/projects/{projectRef}/envvars/{env}',
    {
      params: { path: { projectRef, env } },
    }
  );

  if (error || !response.ok) {
    const message = (error as { error?: string })?.error ?? 'Failed to fetch environment variables';
    throw new ApiError(response.status, { error: message });
  }

  return data!;
}

export async function createEnvVar(
  projectRef: string,
  env: EnvType,
  envVar: { name: string; value: string }
): Promise<{ success: boolean }> {
  const client = getApiClient();
  const { data, error, response } = await client.POST(
    '/api/v1/projects/{projectRef}/envvars/{env}',
    {
      params: { path: { projectRef, env } },
      body: envVar,
    }
  );

  if (error || !response.ok) {
    const message = (error as { error?: string })?.error ?? 'Failed to create environment variable';
    throw new ApiError(response.status, { error: message });
  }

  return data!;
}

export async function retrieveEnvVar(
  projectRef: string,
  env: EnvType,
  name: string
): Promise<EnvVarValue> {
  const client = getApiClient();
  const { data, error, response } = await client.GET(
    '/api/v1/projects/{projectRef}/envvars/{env}/{name}',
    {
      params: { path: { projectRef, env, name } },
    }
  );

  if (error || !response.ok) {
    const message = (error as { error?: string })?.error ?? 'Failed to fetch environment variable';
    throw new ApiError(response.status, { error: message });
  }

  return data!;
}

export async function updateEnvVar(
  projectRef: string,
  env: EnvType,
  name: string,
  value: string
): Promise<{ success: boolean }> {
  const client = getApiClient();
  const { data, error, response } = await client.PUT(
    '/api/v1/projects/{projectRef}/envvars/{env}/{name}',
    {
      params: { path: { projectRef, env, name } },
      body: { value },
    }
  );

  if (error || !response.ok) {
    const message = (error as { error?: string })?.error ?? 'Failed to update environment variable';
    throw new ApiError(response.status, { error: message });
  }

  return data!;
}

export async function deleteEnvVar(
  projectRef: string,
  env: EnvType,
  name: string
): Promise<{ success: boolean }> {
  const client = getApiClient();
  const { data, error, response } = await client.DELETE(
    '/api/v1/projects/{projectRef}/envvars/{env}/{name}',
    {
      params: { path: { projectRef, env, name } },
    }
  );

  if (error || !response.ok) {
    const message = (error as { error?: string })?.error ?? 'Failed to delete environment variable';
    throw new ApiError(response.status, { error: message });
  }

  return data!;
}

export async function importEnvVars(
  projectRef: string,
  env: EnvType,
  variables: EnvVar[],
  override = false
): Promise<ImportEnvVarsResult> {
  const client = getApiClient();
  const { data, error, response } = await client.POST(
    '/api/v1/projects/{projectRef}/envvars/{env}/import',
    {
      params: { path: { projectRef, env } },
      body: { variables, override },
    }
  );

  if (error || !response.ok) {
    const message = (error as { error?: string })?.error ?? 'Failed to import environment variables';
    throw new ApiError(response.status, { error: message });
  }

  return data!;
}
