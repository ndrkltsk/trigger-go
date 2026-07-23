import { useEffect, useRef, useCallback } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { usePreferencesStore } from '@/stores/preferences-store';
import { checkForNewFailures } from '@/services/notifications/failure-detector';
import {
  registerBackgroundNotificationCheck,
  unregisterBackgroundNotificationCheck,
} from '@/services/notifications/background-task';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const POLL_INTERVAL_MS = 30_000;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const setupAndroidChannel = useCallback(async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('run-alerts', {
        name: 'Run Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF0000',
      });
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  }, []);

  // Handle tapping on a notification
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const runId = response.notification.request.content.data?.runId as string | undefined;
      if (runId) {
        const { token } = useAuthStore.getState();
        if (token) {
          router.push(`/(dashboard)/(runs)/${runId}`);
        }
      }
    });

    // Handle cold start from notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const runId = response.notification.request.content.data?.runId as string | undefined;
        if (runId) {
          const { token } = useAuthStore.getState();
          if (token) {
            router.push(`/(dashboard)/(runs)/${runId}`);
          }
        }
      }
    });

    return () => subscription.remove();
  }, [router]);

  // Polling lifecycle
  useEffect(() => {
    setupAndroidChannel();
    requestPermissions();

    const startPolling = () => {
      if (intervalRef.current) return;
      const { token } = useAuthStore.getState();
      if (!token) return;

      // Immediate check
      checkForNewFailures();

      intervalRef.current = setInterval(() => {
        const { notificationsEnabled } = usePreferencesStore.getState();
        if (notificationsEnabled) {
          checkForNewFailures();
        }
      }, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleAppStateChange = (nextState: string) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        startPolling();
      } else if (nextState.match(/inactive|background/)) {
        stopPolling();
      }
      appStateRef.current = nextState as typeof appStateRef.current;
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Start polling if app is active
    if (AppState.currentState === 'active') {
      startPolling();
    }

    // Listen for auth changes
    const unsubAuth = useAuthStore.subscribe((state, prevState) => {
      if (state.token && !prevState.token) {
        startPolling();
      } else if (!state.token && prevState.token) {
        stopPolling();
      }
    });

    return () => {
      stopPolling();
      appStateSubscription.remove();
      unsubAuth();
    };
  }, [setupAndroidChannel, requestPermissions]);

  // Background task lifecycle
  useEffect(() => {
    const syncBackgroundTask = async () => {
      const { token } = useAuthStore.getState();
      const { notificationsEnabled, backgroundCheckEnabled } =
        usePreferencesStore.getState();

      if (token && notificationsEnabled && backgroundCheckEnabled) {
        await registerBackgroundNotificationCheck();
      } else {
        await unregisterBackgroundNotificationCheck();
      }
    };

    syncBackgroundTask();

    const unsubAuth = useAuthStore.subscribe((state, prevState) => {
      if (state.token !== prevState.token) {
        syncBackgroundTask();
      }
    });

    const unsubPrefs = usePreferencesStore.subscribe(
      (state, prevState) => {
        if (
          state.notificationsEnabled !== prevState.notificationsEnabled ||
          state.backgroundCheckEnabled !== prevState.backgroundCheckEnabled ||
          state.backgroundCheckInterval !== prevState.backgroundCheckInterval
        ) {
          syncBackgroundTask();
        }
      }
    );

    return () => {
      unsubAuth();
      unsubPrefs();
    };
  }, []);

  return <>{children}</>;
}
