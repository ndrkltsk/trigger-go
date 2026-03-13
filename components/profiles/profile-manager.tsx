import { useState, useCallback, useRef, useEffect } from 'react';
import { View, FlatList } from 'react-native';
import { ContentContainer } from '@/components/layout';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { ConfirmSheet, type ConfirmSheetRef } from '@/components/shared/confirm-sheet';
import { ProjectPickerSheet, type ProjectPickerSheetRef } from '@/components/shared/project-picker-sheet';
import { ProfileCard } from './profile-card';
import { ProfileFormDialog } from './profile-form-dialog';
import { useProfilesStore } from '@/stores/profiles-store';
import { useProjectsStore } from '@/stores/projects-store';
import { useAuthStore } from '@/stores/auth-store';
import { useFiltersStore } from '@/stores/filters-store';
import { useFavoritesStore } from '@/stores/favorites-store';
import { useEnvironmentsStore } from '@/stores/environments-store';
import { useSecretKeysStore } from '@/stores/secret-keys-store';
import { useToast } from '@/stores/toast-store';
import { maskApiKey, getProfileApiKey } from '@/services/auth/profiles';
import { whoAmI } from '@/services/api/projects';
import { queryClient } from '@/providers/query-provider';
import { Plus, Users } from 'lucide-react-native';
import type { BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';
import type { Project } from '@/services/api/projects';
import { posthogCapture } from '@/services/posthog';
import { API_BASE_URL } from '@/lib/constants';

interface ProfileManagerProps {
  onProfileSwitch?: () => void;
}

export function ProfileManager({ onProfileSwitch }: ProfileManagerProps) {
  const { profiles, activeProfileId, setActiveProfile, addProfile, renameProfile, removeProfile, updateEmail } = useProfilesStore();
  const { showToast } = useToast();

  // Backfill email for the active profile if missing
  useEffect(() => {
    if (!activeProfileId) return;
    const active = profiles.find((p) => p.id === activeProfileId);
    if (!active || active.email) return;
    whoAmI()
      .then((user) => {
        if (user.email) {
          updateEmail(activeProfileId, user.email);
        }
      })
      .catch(() => {});
  }, [activeProfileId, profiles, updateEmail]);

  const createSheetRef = useRef<BottomSheetRef>(null);
  const renameSheetRef = useRef<BottomSheetRef>(null);
  const deleteSheetRef = useRef<ConfirmSheetRef>(null);
  const projectPickerRef = useRef<ProjectPickerSheetRef>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedProfileName, setSelectedProfileName] = useState('');
  const pendingProfileIdRef = useRef<string | null>(null);
  const [maskedKeys, setMaskedKeys] = useState<Record<string, string>>({});

  const loadMaskedKey = useCallback(async (id: string) => {
    if (maskedKeys[id]) return;
    const key = await getProfileApiKey(id);
    if (key) {
      setMaskedKeys((prev) => ({ ...prev, [id]: maskApiKey(key) }));
    }
  }, [maskedKeys]);

  const handleProfilePress = useCallback(async (id: string) => {
    if (id === activeProfileId) return;
    await setActiveProfile(id);
    queryClient.clear();
    pendingProfileIdRef.current = id;
    projectPickerRef.current?.present();
  }, [activeProfileId, setActiveProfile]);

  const handleProjectSelect = useCallback(async (project: Project) => {
    projectPickerRef.current?.dismiss();
    const profileId = pendingProfileIdRef.current;

    // Reset all app state (same as sign-out, but keep auth)
    queryClient.clear();
    useFiltersStore.getState().clearAllFilters();
    if (useFiltersStore.getState().isSelectMode) {
      useFiltersStore.getState().toggleSelectMode();
    }
    useFavoritesStore.setState({ favorites: [] });
    useEnvironmentsStore.getState().reset();
    await useSecretKeysStore.getState().clearAllSecretKeys();

    // Set up the new project
    posthogCapture('project selected', { project_ref: project.externalRef, project_name: project.name });
    useProjectsStore.getState().addProject({ projectRef: project.externalRef, name: project.name });
    await useAuthStore.getState().switchProject(project.externalRef);
    if (profileId) {
      useProfilesStore.getState().updateLastProject(profileId, project.externalRef);
    }

    // Re-initialize environment and secret keys for new project
    await Promise.all([
      useEnvironmentsStore.getState().probeEnvironments(project.externalRef),
      useSecretKeysStore.getState().loadSecretKeys(),
    ]);

    onProfileSwitch?.();
  }, [onProfileSwitch]);

  const handleCreate = useCallback(async (data: { name: string; apiKey?: string; serverUrl?: string }) => {
    if (!data.apiKey) return;
    await addProfile({
      name: data.name,
      apiKey: data.apiKey,
      serverUrl: data.serverUrl || API_BASE_URL,
      lastProjectRef: null,
      email: null,
    });
    createSheetRef.current?.dismiss();
    showToast({ type: 'success', title: 'Profile saved' });
  }, [addProfile, showToast]);

  const handleRename = useCallback((data: { name: string }) => {
    if (selectedProfileId) {
      renameProfile(selectedProfileId, data.name);
      renameSheetRef.current?.dismiss();
      showToast({ type: 'success', title: 'Profile renamed' });
    }
  }, [selectedProfileId, renameProfile, showToast]);

  const handleDelete = useCallback(async () => {
    if (selectedProfileId) {
      await removeProfile(selectedProfileId);
      deleteSheetRef.current?.dismiss();
      showToast({ type: 'success', title: 'Profile deleted' });
    }
  }, [selectedProfileId, removeProfile, showToast]);

  const openRename = useCallback((id: string, name: string) => {
    setSelectedProfileId(id);
    setSelectedProfileName(name);
    setTimeout(() => renameSheetRef.current?.present(), 0);
  }, []);

  const openDelete = useCallback((id: string, name: string) => {
    setSelectedProfileId(id);
    setSelectedProfileName(name);
    deleteSheetRef.current?.present({
      description: `Delete "${name}"? The API key will be permanently removed from this device.`,
    });
  }, []);

  return (
    <View className="flex-1">
      <ContentContainer variant="reading">
        <View className="flex-row items-center justify-between px-4 tablet:px-8 py-3">
          <Text className="text-base font-semibold text-foreground">Saved Profiles</Text>
          <Button variant="outline" size="sm" onPress={() => createSheetRef.current?.present()}>
            <Plus size={16} color="#8B95A5" />
            <Text className="text-mobile-caption font-medium text-foreground">Add</Text>
          </Button>
        </View>
      </ContentContainer>

      {profiles.length === 0 ? (
        <View className="items-center py-12 px-8">
          <Users size={40} color="#8B95A5" />
          <Text className="text-mobile-secondary text-muted-foreground mt-3 text-center">
            No saved profiles. Add a profile to quickly switch between projects.
          </Text>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            loadMaskedKey(item.id);
            return (
              <ContentContainer variant="reading">
                <ProfileCard
                  name={item.name}
                  email={item.email}
                  maskedKey={maskedKeys[item.id] ?? '****'}
                  isActive={item.id === activeProfileId}
                  onPress={() => handleProfilePress(item.id)}
                  onDelete={() => openDelete(item.id, item.name)}
                  onRename={() => openRename(item.id, item.name)}
                />
              </ContentContainer>
            );
          }}
        />
      )}

      <ProfileFormDialog
        ref={createSheetRef}
        mode="create"
        onSave={handleCreate}
      />

      <ProfileFormDialog
        ref={renameSheetRef}
        mode="rename"
        initialName={selectedProfileName}
        onSave={handleRename}
      />

      <ConfirmSheet
        ref={deleteSheetRef}
        title="Delete Profile?"
        description={`Delete "${selectedProfileName}"? The API key will be permanently removed from this device.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />

      <ProjectPickerSheet
        ref={projectPickerRef}
        onSelect={handleProjectSelect}
      />
    </View>
  );
}
