import { useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useProfilesStore } from '@/stores/profiles-store';
import { isValidTokenFormat } from '@/lib/validation';
import { fetchProjects, whoAmI } from '@/services/api/projects';
import { API_BASE_URL } from '@/lib/constants';
import { setSentryUser, clearSentryUser, Sentry, metrics } from '@/services/sentry';
import { posthogCapture, posthogIdentify, posthogReset, posthogRegister } from '@/services/posthog';

export function useAuth() {
  const {
    token,
    baseUrl,
    projectRef,
    isAuthenticated,
    isLoading: isRestoringSession,
    setCredentials,
    clearCredentials,
    loadCredentials,
  } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (apiKey: string, customBaseUrl?: string) => {
      setError(null);
      setIsLoading(true);

      try {
        if (!apiKey.trim()) {
          setError('Please enter a Personal Access Token.');
          return false;
        }

        if (!isValidTokenFormat(apiKey)) {
          metrics.count('auth.login.invalid_format', 1);
          setError('Invalid token format. Tokens should start with tr_pat_.');
          return false;
        }

        // Set credentials so the API client can use the token
        await setCredentials(apiKey, customBaseUrl);

        // Validate by fetching projects
        metrics.count('auth.login.attempt', 1);
        Sentry.logger.info('Login attempt: validating PAT');
        const loginStart = Date.now();
        await fetchProjects();

        // Auto-create a profile for this PAT if one doesn't already exist
        const profilesStore = useProfilesStore.getState();
        profilesStore.loadProfiles();
        if (!profilesStore.activeProfileId) {
          const serverUrl = customBaseUrl || API_BASE_URL;
          let name = serverUrl === API_BASE_URL ? 'Trigger.dev Cloud' : serverUrl;
          let email: string | null = null;
          try {
            const user = await whoAmI();
            name = user.displayName || user.email;
            email = user.email ?? null;
            setSentryUser(user.userId, user.email);
            Sentry.logger.info(Sentry.logger.fmt`Login successful for user ${user.email}`);
            posthogIdentify(user.userId, { email: user.email, name: user.displayName ?? null });
            posthogRegister({ server_url: serverUrl });
          } catch {
            // whoAmI is best-effort; fall back to server-based name
          }
          const profile = await profilesStore.addProfile({
            name,
            apiKey,
            serverUrl,
            lastProjectRef: null,
            email,
          });
          await useProfilesStore.getState().setActiveProfile(profile.id);
        }

        metrics.count('auth.login.success', 1);
        metrics.distribution('auth.login.duration', Date.now() - loginStart, { unit: 'millisecond' });

        posthogCapture('user logged_in', {
          server_url: customBaseUrl || API_BASE_URL,
          has_custom_server: !!customBaseUrl,
        });

        return 'needs_project' as const;
      } catch (err) {
        metrics.count('auth.login.failure', 1);
        Sentry.captureException(err, { extra: { action: 'login' } });
        await clearCredentials();
        setError('Unable to connect. Please check your token and try again.');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setCredentials, clearCredentials]
  );

  const logout = useCallback(async () => {
    metrics.count('auth.logout', 1);
    Sentry.logger.info('User logged out');
    posthogCapture('user logged_out');
    posthogReset();
    clearSentryUser();
    await clearCredentials();
  }, [clearCredentials]);

  const restoreSession = useCallback(async (): Promise<boolean> => {
    await loadCredentials();
    const restored = useAuthStore.getState().isAuthenticated;
    metrics.count('auth.session_restore', 1, { attributes: { success: String(restored) } });
    if (restored) {
      posthogCapture('session restored', { had_project: !!useAuthStore.getState().projectRef });
    }
    return restored;
  }, [loadCredentials]);

  return {
    token,
    baseUrl,
    projectRef,
    isAuthenticated,
    isLoading: isLoading || isRestoringSession,
    error,
    login,
    logout,
    restoreSession,
  };
}
