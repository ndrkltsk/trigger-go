import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

import { ProjectPickerSheet, type ProjectPickerSheetRef } from '@/components/shared/project-picker-sheet';
import { useAuth } from '@/hooks/use-auth';
import { useProfilesStore } from '@/stores/profiles-store';
import { useProjectsStore } from '@/stores/projects-store';
import { useAuthStore } from '@/stores/auth-store';
import { useEnvironmentsStore } from '@/stores/environments-store';
import { useSecretKeysStore } from '@/stores/secret-keys-store';
import { maskApiKey, getProfileApiKey } from '@/services/auth/profiles';
import { queryClient } from '@/providers/query-provider';
import { API_BASE_URL } from '@/lib/constants';
import type { Project } from '@/services/api/projects';

export default function LoginScreen() {
  const { login, isLoading, error } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { profiles, loadProfiles, setActiveProfile } = useProfilesStore();
  const [maskedKeys, setMaskedKeys] = useState<Record<string, string>>({});
  const projectPickerRef = useRef<ProjectPickerSheetRef>(null);
  const pendingProfileIdRef = useRef<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    profiles.forEach(async (p) => {
      if (!maskedKeys[p.id]) {
        const key = await getProfileApiKey(p.id);
        if (key) {
          setMaskedKeys((prev) => ({ ...prev, [p.id]: maskApiKey(key) }));
        }
      }
    });
  }, [profiles, maskedKeys]);

  const handleConnect = async () => {
    const result = await login(apiKey, serverUrl.trim() || undefined);
    if (result === 'needs_project') {
      const profilesState = useProfilesStore.getState();
      pendingProfileIdRef.current = profilesState.activeProfileId;
      projectPickerRef.current?.present();
    }
  };

  const handleProfileSelect = useCallback(async (id: string) => {
    await setActiveProfile(id);
    queryClient.clear();
    pendingProfileIdRef.current = id;
    projectPickerRef.current?.present();
  }, [setActiveProfile]);

  const handleProjectSelect = useCallback(async (project: Project) => {
    projectPickerRef.current?.dismiss();
    const profileId = pendingProfileIdRef.current;

    // Clear all stale data
    queryClient.clear();

    // Set up the new project
    useProjectsStore.getState().addProject({ projectRef: project.externalRef, name: project.name });
    await useAuthStore.getState().switchProject(project.externalRef);
    if (profileId) {
      useProfilesStore.getState().updateLastProject(profileId, project.externalRef);
    }

    // Initialize environment and secret keys for the project
    await Promise.all([
      useEnvironmentsStore.getState().probeEnvironments(project.externalRef),
      useSecretKeysStore.getState().loadSecretKeys(),
    ]);

    router.replace('/(dashboard)');
  }, []);

  return (
    <>
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="flex-1 justify-center px-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center gap-6">
          {/* Logo */}
          <Image
            source={require('@/assets/icon.png')}
            className="h-16 w-16 rounded-xl"
            resizeMode="contain"
            accessibilityLabel="Trigger.dev logo"
          />

          {/* Title */}
          <View className="items-center gap-2">
            <Text variant="h3" className="border-b-0 text-center">
              Connect to Trigger.dev
            </Text>
            <Text variant="muted" className="text-center">
              Paste your Personal Access Token from the Trigger.dev dashboard.
            </Text>
          </View>

          {/* API Key input */}
          <View className="w-full gap-3">
            <View className="relative w-full">
              <Input
                className="w-full pr-12"
                placeholder="tr_pat_..."
                value={apiKey}
                onChangeText={setApiKey}
                secureTextEntry={!showKey}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                editable={!isLoading}
                accessibilityLabel="Personal Access Token"
                accessibilityHint="Enter your Trigger.dev Personal Access Token"
              />
              <View className="absolute right-0 top-0 h-12 w-12 items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onPress={() => setShowKey(!showKey)}
                  disabled={isLoading}
                  accessibilityLabel={showKey ? 'Hide token' : 'Show token'}
                >
                  <Icon
                    as={showKey ? EyeOff : Eye}
                    className="text-muted-foreground"
                    size={18}
                  />
                </Button>
              </View>
            </View>

            {/* Error message */}
            {error && (
              <Text variant="small" className="text-destructive">
                {error}
              </Text>
            )}

            {/* Connect button */}
            <Button
              className="w-full"
              onPress={handleConnect}
              disabled={isLoading || !apiKey.trim()}
            >
              {isLoading ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="white" />
                  <Text>Connecting...</Text>
                </View>
              ) : (
                <Text>Connect</Text>
              )}
            </Button>

            {/* Self-hosted toggle */}
            <Pressable onPress={() => setShowAdvanced(!showAdvanced)}>
              <Text className="text-sm text-muted-foreground text-center">
                {showAdvanced ? 'Hide advanced' : 'Self-hosted?'}
              </Text>
            </Pressable>

            {/* Server URL input (collapsible) */}
            {showAdvanced && (
              <Input
                className="w-full"
                placeholder={API_BASE_URL}
                value={serverUrl}
                onChangeText={setServerUrl}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                keyboardType="url"
                editable={!isLoading}
                accessibilityLabel="Server URL"
                accessibilityHint="Enter your self-hosted Trigger.dev server URL"
              />
            )}
          </View>

          {/* Saved Profiles */}
          {profiles.length > 0 && (
            <View className="w-full">
              <Text className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Saved Profiles
              </Text>
              <View className="bg-card border-border rounded-md border overflow-hidden">
                {profiles.map((profile) => (
                  <Pressable
                    key={profile.id}
                    onPress={() => handleProfileSelect(profile.id)}
                    className="flex-row items-center px-4 py-3 active:opacity-70"
                    accessibilityRole="button"
                    accessibilityLabel={`Connect with profile ${profile.name}`}
                  >
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground">{profile.name}</Text>
                      <Text className="text-xs text-muted-foreground">
                        {maskedKeys[profile.id] ?? '****'}
                      </Text>
                      {profile.serverUrl && profile.serverUrl !== API_BASE_URL && (
                        <Text className="text-xs text-muted-foreground">
                          {profile.serverUrl}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Help link */}
          <Button
            variant="link"
            onPress={() =>
              Linking.openURL('https://trigger.dev/docs/management/overview')
            }
          >
            <Text>Where do I find my Personal Access Token?</Text>
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>

    <ProjectPickerSheet
      ref={projectPickerRef}
      onSelect={handleProjectSelect}
    />
    </>
  );
}
