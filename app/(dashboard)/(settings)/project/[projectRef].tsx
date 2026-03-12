import { View, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { useProjectsStore } from '@/stores/projects-store';
import { useProjects, useSwitchProject } from '@/hooks/api/use-projects';
import { useEnvironmentsStore } from '@/stores/environments-store';
import { useSecretKeysStore } from '@/stores/secret-keys-store';
import { useToast } from '@/stores/toast-store';
import { SecretKeyRow } from '@/components/settings/secret-key-row';

export default function ProjectDetailScreen() {
  const { projectRef } = useLocalSearchParams<{ projectRef: string }>();
  const currentProjectRef = useAuthStore((s) => s.projectRef);
  const addProject = useProjectsStore((s) => s.addProject);
  const { data: projects, isLoading } = useProjects();
  const switchProject = useSwitchProject();
  const availableEnvironments = useEnvironmentsStore((s) => s.availableEnvironments);
  const probeEnvironments = useEnvironmentsStore((s) => s.probeEnvironments);
  const loadSecretKeys = useSecretKeysStore((s) => s.loadSecretKeys);
  const { showToast } = useToast();

  const project = projects?.find((p) => p.externalRef === projectRef);
  const isCurrent = projectRef === currentProjectRef;

  const handleSwitch = () => {
    if (!project || isCurrent) return;
    addProject({ projectRef: project.externalRef, name: project.name });
    switchProject.mutate(project.externalRef, {
      onSuccess: async () => {
        showToast({ type: 'success', title: `Switched to ${project.name}` });
        await probeEnvironments(project.externalRef);
        await loadSecretKeys();
      },
    });
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Project' }} />
        <View className="flex-1 bg-background items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <Stack.Screen options={{ title: 'Project' }} />
        <View className="flex-1 bg-background items-center justify-center px-4">
          <Text className="text-mobile-secondary text-muted-foreground">Project not found.</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: project.name }} />
      <ScrollView className="flex-1 bg-background">
        {/* Header section */}
        <Card className="mx-4 mt-4 p-4">
          <Text className="text-lg font-semibold text-foreground">{project.name}</Text>
          <Text className="text-mobile-caption text-muted-foreground mt-1">
            {project.externalRef}
          </Text>
          <Text className="text-mobile-caption text-muted-foreground mt-2">
            {project.organization.title}
          </Text>
        </Card>

        {/* Switch / Current badge */}
        <View className="mx-4 mt-4">
          {isCurrent ? (
            <View className="flex-row items-center gap-2 bg-green-500/10 rounded-lg px-4 py-3">
              <Check size={16} color="#22c55e" />
              <Text className="text-sm font-medium text-green-500">Current Project</Text>
            </View>
          ) : (
            <Button
              onPress={handleSwitch}
              disabled={switchProject.isPending}
            >
              {switchProject.isPending ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#fff" />
                  <Text className="text-sm font-medium text-primary-foreground">Switching...</Text>
                </View>
              ) : (
                <Text className="text-sm font-medium text-primary-foreground">Switch to this project</Text>
              )}
            </Button>
          )}
        </View>

        {/* Secret API Keys section */}
        <View className="mt-6">
          <Text className="text-mobile-tab font-semibold text-muted-foreground px-4 mb-2 uppercase tracking-wide">
            Secret API Keys
          </Text>
          <Card className="mx-4 py-0 overflow-hidden">
            {availableEnvironments.map((env, index) => (
              <View key={env}>
                {index > 0 && <View className="border-border border-t" />}
                <SecretKeyRow env={env} />
              </View>
            ))}
          </Card>
          <Text className="text-mobile-caption text-muted-foreground px-4 mt-2 mb-8">
            Secret keys are stored securely on-device and are required for deployments and schedules.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}
