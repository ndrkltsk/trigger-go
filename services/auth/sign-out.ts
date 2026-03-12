import type { QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { useProfilesStore } from '@/stores/profiles-store';
import { useFiltersStore } from '@/stores/filters-store';
import { useProjectsStore } from '@/stores/projects-store';
import { useFavoritesStore } from '@/stores/favorites-store';
import { useEnvironmentsStore } from '@/stores/environments-store';
import { useSecretKeysStore } from '@/stores/secret-keys-store';
import { getActiveProfileId } from '@/services/auth/profiles';

export async function signOut(queryClient: QueryClient) {
  // Clear all TanStack Query caches
  queryClient.clear();

  // Remove the active profile (also clears auth credentials)
  // Read from persistent storage since the zustand store may not have been hydrated
  const activeProfileId = getActiveProfileId();
  if (activeProfileId) {
    await useProfilesStore.getState().removeProfile(activeProfileId);
  } else {
    await useAuthStore.getState().clearCredentials();
  }

  // Reset filters store
  useFiltersStore.getState().clearAllFilters();
  if (useFiltersStore.getState().isSelectMode) {
    useFiltersStore.getState().toggleSelectMode();
  }

  // Clear saved projects
  useProjectsStore.setState({ savedProjects: [] });

  // Clear favorites
  useFavoritesStore.setState({ favorites: [] });

  // Reset environments store
  useEnvironmentsStore.getState().reset();

  // Clear secret keys
  await useSecretKeysStore.getState().clearAllSecretKeys();
}
