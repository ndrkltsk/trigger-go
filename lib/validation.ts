import type { Environment } from '@/stores/preferences-store';

export function isValidTokenFormat(token: string): boolean {
  return token.startsWith('tr_pat_');
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Verifies that a self-hosted server URL points to a valid Trigger.dev instance.
 * Hits GET /api/v2/whoami without a token — a real Trigger.dev server returns
 * 401 with a JSON error body. Any other response means it's not a Trigger.dev API.
 */
export async function verifyServerUrl(url: string): Promise<{ ok: boolean; error?: string }> {
  const normalized = normalizeUrl(url.trim());

  if (!isValidUrl(normalized)) {
    return { ok: false, error: 'Invalid URL format. Please enter a valid server URL (e.g., https://your-server.com).' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(`${normalized}/api/v2/whoami`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status >= 500) {
      return { ok: false, error: `Server returned an error (${response.status}). Please verify the URL is correct.` };
    }

    // A real Trigger.dev instance returns 401 with a JSON body for unauthenticated requests.
    // Any other status (200, 301, 404, etc.) means this isn't a Trigger.dev API.
    if (response.status !== 401) {
      return { ok: false, error: 'This does not appear to be a Trigger.dev instance. Please check the URL.' };
    }

    // Verify the 401 response is JSON (not an HTML login page or reverse proxy error)
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return { ok: false, error: 'This does not appear to be a Trigger.dev instance. Please check the URL.' };
    }

    return { ok: true };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { ok: false, error: 'Server did not respond in time. Please check the URL and try again.' };
    }
    return { ok: false, error: 'Unable to reach the server. Please check the URL and your network connection.' };
  } finally {
    clearTimeout(timeout);
  }
}

const SECRET_KEY_PREFIXES: Record<Environment, string> = {
  dev: 'tr_dev_',
  staging: 'tr_stg_',
  prod: 'tr_prod_',
  preview: 'tr_preview_',
};

export function isValidSecretKeyFormat(key: string, env: Environment): boolean {
  return key.startsWith(SECRET_KEY_PREFIXES[env]);
}
