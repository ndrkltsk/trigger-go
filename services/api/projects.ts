import { getAuthToken, getBaseUrl } from '@/stores/auth-store';
import { ApiError } from '@/lib/errors';
import { Sentry, metrics } from '@/services/sentry';

export interface SavedProject {
  projectRef: string;
  name: string;
}

export interface ProjectOrganization {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
}

export interface Project {
  id: string;
  externalRef: string;
  name: string;
  slug: string;
  createdAt: string;
  organization: ProjectOrganization;
}

export interface WhoAmI {
  userId: string;
  email: string;
  dashboardUrl: string;
  displayName?: string;
  project?: {
    name: string;
    url: string;
    orgTitle: string;
  };
}

export async function fetchProjects(): Promise<Project[]> {
  const token = getAuthToken();
  const baseUrl = getBaseUrl();

  if (!token) {
    throw new Error('No auth token available');
  }

  const url = `${baseUrl}/api/v1/projects`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  const fetchStart = Date.now();
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    metrics.distribution('api.projects.fetch.duration', Date.now() - fetchStart, { unit: 'millisecond' });

    if (!response.ok) {
      metrics.count('api.projects.fetch.error', 1, { attributes: { status: String(response.status) } });
      const body = await response.text().catch(() => '');
      let parsed: { error?: string } = {};
      try { parsed = JSON.parse(body); } catch {}
      const err = new ApiError(response.status, { error: parsed.error ?? `Failed to fetch projects (${response.status})` });
      Sentry.logger.error(Sentry.logger.fmt`fetchProjects failed: HTTP ${response.status}`);
      Sentry.captureException(err, { extra: { status: response.status } });
      throw err;
    }

    const data = await response.json();
    return data.data ?? data;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      metrics.count('api.projects.fetch.timeout', 1);
      throw new Error('Request timed out');
    }
    if (!(error instanceof ApiError)) {
      Sentry.captureException(error);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function whoAmI(): Promise<WhoAmI> {
  const token = getAuthToken();
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/api/v2/whoami`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    let parsed: { error?: string } = {};
    try { parsed = JSON.parse(body); } catch {}
    throw new ApiError(response.status, { error: parsed.error ?? `Token validation failed (${response.status})` });
  }

  return response.json();
}
