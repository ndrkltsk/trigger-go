import '@/global.css';
import { useEffect, useRef } from 'react';
import { PortalHost } from '@rn-primitives/portal';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ToastContainer } from '@/components/shared/toast';
import { NotificationProvider } from '@/providers/notification-provider';
import { AppLockScreen } from '@/components/shared/app-lock-screen';
import { useAppLock } from '@/hooks/use-app-lock';
import { useAuthStore } from '@/stores/auth-store';
import { usePreferencesStore } from '@/stores/preferences-store';
import { startNetworkListener, stopNetworkListener } from '@/services/network/connectivity';
import { initSentry, Sentry } from '@/services/sentry';
import { PostHogProvider } from 'posthog-react-native';
import { getPostHogClient } from '@/services/posthog';

export { RootErrorBoundary as ErrorBoundary } from '@/components/shared/root-error-boundary';

initSentry();

function RootLayout() {
  const { isLocked, unlock } = useAppLock();
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAuthStore();
  const wasAuthenticated = useRef(isAuthenticated);

  useEffect(() => {
    usePreferencesStore.getState().loadPreferences();
    startNetworkListener();
    return () => stopNetworkListener();
  }, []);

  // Redirect to login when auth state is lost (e.g. after logout or token invalidation)
  useEffect(() => {
    if (isLoading) return;

    const inLogin = segments[0] === '(auth)' && (segments as string[])[1] === 'login';

    if (wasAuthenticated.current && !isAuthenticated && !inLogin) {
      router.replace('/(auth)/login');
    }

    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated, isLoading, segments, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PostHogProvider
        client={getPostHogClient()}
        autocapture={{
          captureTouches: true,
          captureScreens: true,
          propsToCapture: ['testID'],
        }}
      >
        <QueryProvider>
          <ThemeProvider>
            <NotificationProvider>
              <Stack screenOptions={{ headerShown: false }} />
              <PortalHost />
              <ToastContainer />
              {isLocked && <AppLockScreen onUnlock={unlock} />}
            </NotificationProvider>
          </ThemeProvider>
        </QueryProvider>
      </PostHogProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
