import { QueryClient, QueryClientProvider, QueryCache, MutationCache, focusManager, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { AppState, type AppStateStatus } from 'react-native';
import { useEffect } from 'react';
import { ApiError } from '@/lib/errors';
import { useAuthStore } from '@/stores/auth-store';
import { useNetworkStore } from '@/stores/network-store';
import { metrics } from '@/services/sentry';

function handleUnauthorized(error: Error) {
  if (error instanceof ApiError && error.isUnauthorized) {
    metrics.count('query.unauthorized_logout', 1);
    useAuthStore.getState().clearCredentials();
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleUnauthorized,
  }),
  mutationCache: new MutationCache({
    onError: handleUnauthorized,
  }),
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      retry: (failureCount, error) => {
        if (!useNetworkStore.getState().isConnected) return false;
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10_000),
      staleTime: 10_000,
      gcTime: 30 * 60 * 1000,
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: false,
    },
  },
});

// Wire TanStack Query's onlineManager to NetInfo
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

function onAppStateChange(status: AppStateStatus) {
  focusManager.setFocused(status === 'active');
}

export { queryClient };

export function QueryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  // Refresh all data when coming back online
  useEffect(() => {
    return useNetworkStore.subscribe((state, prevState) => {
      if (state.isConnected && !prevState.isConnected) {
        metrics.count('query.online_resume', 1);
        queryClient.resumePausedMutations().then(() => {
          queryClient.invalidateQueries();
        });
      }
    });
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
