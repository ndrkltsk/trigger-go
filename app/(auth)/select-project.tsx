import { useCallback, useEffect } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, FolderKanban, RefreshCw } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ContentContainer } from '@/components/layout';
import { useProjects, useSwitchProject } from '@/hooks/api/use-projects';
import { useProjectsStore } from '@/stores/projects-store';
import { useProfilesStore } from '@/stores/profiles-store';
import type { Project } from '@/services/api/projects';
import { posthogCapture } from '@/services/posthog';

export default function SelectProjectScreen() {
  const { data: projects, isLoading, isError, refetch } = useProjects();
  const switchProject = useSwitchProject();
  const addProject = useProjectsStore((s) => s.addProject);
  const { loadProfiles, activeProfileId, updateLastProject } = useProfilesStore();

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleSelect = useCallback(
    (project: Project) => {
      posthogCapture('project selected', { project_ref: project.externalRef, project_name: project.name });
      addProject({ projectRef: project.externalRef, name: project.name });
      switchProject.mutate(project.externalRef, {
        onSuccess: () => {
          if (activeProfileId) {
            updateLastProject(activeProfileId, project.externalRef);
          }
          router.replace('/(dashboard)');
        },
      });
    },
    [addProject, switchProject, activeProfileId, updateLastProject]
  );

  // Group projects by organization
  const grouped = (projects ?? []).reduce<Record<string, { org: string; projects: Project[] }>>(
    (acc, project) => {
      const orgSlug = project.organization.slug;
      if (!acc[orgSlug]) {
        acc[orgSlug] = { org: project.organization.title, projects: [] };
      }
      acc[orgSlug].projects.push(project);
      return acc;
    },
    {}
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-16 pb-4 gap-3">
        <Button
          variant="ghost"
          size="icon"
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <Icon as={ArrowLeft} className="text-foreground" size={20} />
        </Button>
        <Text variant="h4" className="flex-1 border-b-0">Select a Project</Text>
      </View>

      {/* Loading */}
      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
          <Text variant="muted" className="mt-4">Loading projects...</Text>
        </View>
      )}

      {/* Error */}
      {isError && (
        <View className="flex-1 items-center justify-center px-6 gap-4">
          <Text variant="muted" className="text-center">
            Failed to load projects. Please check your token and try again.
          </Text>
          <Button onPress={() => refetch()} variant="outline">
            <View className="flex-row items-center gap-2">
              <Icon as={RefreshCw} className="text-foreground" size={16} />
              <Text>Retry</Text>
            </View>
          </Button>
        </View>
      )}

      {/* Project list */}
      {!isLoading && !isError && (
        <ScrollView className="flex-1" contentContainerClassName="pb-8">
          <ContentContainer variant="reading">
            {Object.entries(grouped).map(([orgSlug, { org, projects: orgProjects }]) => (
              <View key={orgSlug} className="mt-4 tablet:mt-6">
                <Text className="text-xs font-semibold text-muted-foreground px-6 tablet:px-8 mb-2 uppercase tracking-wide">
                  {org}
                </Text>
                <View className="bg-card border-border mx-4 tablet:mx-8 rounded-md border overflow-hidden">
                  {orgProjects.map((project) => (
                    <Pressable
                      key={project.id}
                      onPress={() => handleSelect(project)}
                      className="flex-row items-center px-4 py-3.5 active:opacity-70"
                      accessibilityRole="button"
                      accessibilityLabel={`Select project ${project.name}`}
                    >
                      <Icon as={FolderKanban} className="text-primary mr-3" size={20} />
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-foreground">{project.name}</Text>
                        <Text className="text-xs text-muted-foreground">
                          {project.externalRef}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}

            {projects?.length === 0 && (
              <View className="items-center px-6 mt-8">
                <Text variant="muted" className="text-center">
                  No projects found. Create a project on the Trigger.dev dashboard first.
                </Text>
              </View>
            )}
          </ContentContainer>
        </ScrollView>
      )}
    </View>
  );
}
