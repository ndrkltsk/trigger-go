import createClient from 'openapi-fetch';
import type { paths } from './generated-types';
import { getAuthToken, getBaseUrl, useAuthStore } from '@/stores/auth-store';
import { useNetworkStore } from '@/stores/network-store';
import { usePreferencesStore } from '@/stores/preferences-store';
import { getSecretKeyForEnv } from '@/stores/secret-keys-store';
import { MissingSecretKeyError } from '@/lib/errors';
import { Sentry } from '@/services/sentry';

let clientInstance: ReturnType<typeof createClient<paths>> | null = null;

export function getApiClient() {
  if (!clientInstance) {
    clientInstance = createApiClient(getBaseUrl());
  }
  return clientInstance;
}

// --- JWT exchange for endpoints that require secret key / JWT auth ---

interface JwtCacheEntry {
  token: string;
  expiresAt: number; // timestamp ms
}

const jwtCache = new Map<string, JwtCacheEntry>();

/**
 * Exchange the PAT for a scoped JWT token via POST /api/v1/projects/{projectRef}/{env}/jwt.
 * Results are cached for 55 minutes (tokens expire after 1 hour).
 */
async function getJwtToken(projectRef: string, env: string): Promise<string> {
  const cacheKey = `${projectRef}:${env}`;
  const cached = jwtCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  const baseUrl = getBaseUrl();
  const pat = getAuthToken();

  if (!pat) {
    throw new Error('Not authenticated');
  }

  Sentry.addBreadcrumb({ category: 'jwt', message: `Exchanging PAT for JWT: ${cacheKey}` });
  Sentry.logger.info(Sentry.logger.fmt`JWT exchange for project ${projectRef} env ${env}`);

  const url = `${baseUrl}/api/v1/projects/${encodeURIComponent(projectRef)}/${encodeURIComponent(env)}/jwt`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pat}`,
    },
    body: JSON.stringify({
      claims: {
        scopes: ['read:runs', 'write:runs', 'write:tasks'],
      },
    }),
  });

  if (!response.ok) {
    jwtCache.delete(cacheKey);
    const body = await response.text().catch(() => '');
    let parsed: { error?: string } = {};
    try { parsed = JSON.parse(body); } catch {}
    const err = new Error(parsed.error ?? `Failed to get JWT (${response.status})`);
    Sentry.logger.error(Sentry.logger.fmt`JWT exchange failed: ${response.status} for ${cacheKey}`);
    Sentry.captureException(err, { extra: { status: response.status, projectRef, env } });
    throw err;
  }

  const data = (await response.json()) as { token: string };

  // Cache for 55 minutes (JWT typically expires in 1h)
  jwtCache.set(cacheKey, {
    token: data.token,
    expiresAt: Date.now() + 55 * 60 * 1000,
  });

  return data.token;
}

/**
 * Get an openapi-fetch client authenticated with a scoped JWT (not PAT).
 * Use this for endpoints that require secret key auth (e.g. GET /api/v3/runs/{runId}).
 */
export async function getJwtApiClient(): Promise<ReturnType<typeof createClient<paths>>> {
  const { projectRef } = useAuthStore.getState();
  const { selectedEnvironment } = usePreferencesStore.getState();

  if (!projectRef) {
    throw new Error('No project selected');
  }

  const jwt = await getJwtToken(projectRef, selectedEnvironment);

  const client = createClient<paths>({
    baseUrl: getBaseUrl(),
    querySerializer: (params) => serializeQueryParams(params as Record<string, unknown>),
  });

  client.use({
    async onRequest({ request }) {
      request.headers.set('Authorization', `Bearer ${jwt}`);
      return request;
    },
    async onResponse({ response }) {
      if (response.ok) {
        useNetworkStore.getState().setLastSyncTime(new Date().toISOString());
      }
      return response;
    },
  });

  return client;
}

export function clearJwtCache() {
  jwtCache.clear();
}

/**
 * Make an authenticated fetch request using JWT auth.
 * Use for endpoints not in the OpenAPI spec.
 */
export async function jwtFetch(path: string, init?: RequestInit): Promise<Response> {
  const { projectRef } = useAuthStore.getState();
  const { selectedEnvironment } = usePreferencesStore.getState();

  if (!projectRef) throw new Error('No project selected');

  const jwt = await getJwtToken(projectRef, selectedEnvironment);
  const baseUrl = getBaseUrl();

  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${jwt}`,
    },
  });
}

function serializeQueryParams(query: Record<string, unknown>): string {
  const parts: string[] = [];

  function serialize(obj: unknown, prefix: string) {
    if (obj === null || obj === undefined) return;
    if (Array.isArray(obj)) {
      parts.push(`${encodeURIComponent(prefix)}=${obj.map((item) => encodeURIComponent(String(item))).join(',')}`);
    } else if (typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        serialize(value, prefix ? `${prefix}[${key}]` : key);
      }
    } else {
      parts.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(obj))}`);
    }
  }

  serialize(query, '');
  return parts.join('&');
}

export function createApiClient(baseUrl: string) {
  const client = createClient<paths>({
    baseUrl,
    querySerializer: (params) => serializeQueryParams(params as Record<string, unknown>),
  });

  client.use({
    async onRequest({ request }) {
      const token = getAuthToken();
      if (token) {
        request.headers.set('Authorization', `Bearer ${token}`);
      }
      return request;
    },
    async onResponse({ response }) {
      if (response.ok) {
        useNetworkStore.getState().setLastSyncTime(new Date().toISOString());
      }
      return response;
    },
  });

  return client;
}

let secretClientCache: {
  key: string;
  client: ReturnType<typeof createClient<paths>>;
} | null = null;

export function getSecretApiClient() {
  const env = usePreferencesStore.getState().selectedEnvironment;
  const secretKey = getSecretKeyForEnv(env);

  if (!secretKey) {
    throw new MissingSecretKeyError(env);
  }

  const baseUrl = getBaseUrl();
  const cacheKey = `${baseUrl}:${env}:${secretKey}`;

  if (secretClientCache && secretClientCache.key === cacheKey) {
    return secretClientCache.client;
  }

  const client = createClient<paths>({
    baseUrl,
    querySerializer: (params) => serializeQueryParams(params as Record<string, unknown>),
  });

  client.use({
    async onRequest({ request }) {
      request.headers.set('Authorization', `Bearer ${secretKey}`);
      return request;
    },
    async onResponse({ response }) {
      if (response.ok) {
        useNetworkStore.getState().setLastSyncTime(new Date().toISOString());
      }
      return response;
    },
  });

  secretClientCache = { key: cacheKey, client };
  return client;
}

export function resetApiClient() {
  clientInstance = null;
  secretClientCache = null;
  jwtCache.clear();
}

// Auto-reset client when auth token or base URL changes
useAuthStore.subscribe(
  (state, prevState) => {
    if (state.token !== prevState.token || state.baseUrl !== prevState.baseUrl) {
      clientInstance = null;
      jwtCache.clear();
    }
  }
);
