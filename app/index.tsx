import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { useEnvironmentsStore } from '@/stores/environments-store';
import { useSecretKeysStore } from '@/stores/secret-keys-store';
import { useProfilesStore } from '@/stores/profiles-store';
import { useProjectsStore } from '@/stores/projects-store';

export default function Index() {
  const { restoreSession, isAuthenticated, projectRef } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [destination, setDestination] = useState<
    '/(dashboard)/(home)' | '/(auth)/select-project' | '/(auth)/login'
  >('/(auth)/login');

  useEffect(() => {
    async function init() {
      await restoreSession();

      // Hydrate saved projects from storage so project names are available
      useProjectsStore.getState().loadProjects();

      const authState = useAuthStore.getState();

      // If fully authenticated (token + project), proceed to dashboard
      if (authState.isAuthenticated && authState.projectRef) {
        await Promise.all([
          useEnvironmentsStore.getState().probeEnvironments(authState.projectRef),
          useSecretKeysStore.getState().loadSecretKeys(),
        ]);
        setDestination('/(dashboard)/(home)');
        setIsReady(true);
        return;
      }

      // Not authenticated — check saved profiles
      useProfilesStore.getState().loadProfiles();
      const { profiles } = useProfilesStore.getState();

      if (profiles.length === 1) {
        // Single profile: auto-select it only if it has a saved project
        const profile = profiles[0];
        if (profile.lastProjectRef) {
          await useProfilesStore.getState().setActiveProfile(profile.id);
          const state = useAuthStore.getState();
          if (state.isAuthenticated && state.projectRef) {
            await Promise.all([
              useEnvironmentsStore.getState().probeEnvironments(state.projectRef),
              useSecretKeysStore.getState().loadSecretKeys(),
            ]);
            setDestination('/(dashboard)/(home)');
          } else {
            setDestination('/(auth)/login');
          }
        } else {
          // Profile exists but no project selected yet — go to login
          setDestination('/(auth)/login');
        }
      } else if (profiles.length > 1) {
        // Multiple profiles: let user choose on login screen
        setDestination('/(auth)/login');
      } else {
        // No profiles: fresh login
        setDestination('/(auth)/login');
      }

      setIsReady(true);
    }
    init();
  }, [restoreSession]);

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href={destination} />;
}
