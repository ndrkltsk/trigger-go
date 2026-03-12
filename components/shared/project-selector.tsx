import React from 'react';
import { Pressable, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Check, ChevronRight, RefreshCw } from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { useProjects } from '@/hooks/api/use-projects';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

export function ProjectSelector() {
  const router = useRouter();
  const currentProjectRef = useAuthStore((s) => s.projectRef);
  const { data: projects, isLoading, isError, refetch } = useProjects();

  const handleNavigate = (projectRef: string) => {
    router.push(`/(dashboard)/(settings)/project/${projectRef}`);
  };

  if (isLoading) {
    return (
      <View className="items-center py-8">
        <ActivityIndicator size="large" />
        <Text className="text-mobile-caption text-muted-foreground mt-2">Loading projects...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="items-center py-8 gap-3">
        <Text className="text-mobile-secondary text-muted-foreground">Failed to load projects.</Text>
        <Button onPress={() => refetch()} variant="outline" size="sm">
          <View className="flex-row items-center gap-2">
            <Icon as={RefreshCw} className="text-foreground" size={14} />
            <Text className="text-sm">Retry</Text>
          </View>
        </Button>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <Text className="text-mobile-body font-semibold text-foreground px-4">Projects</Text>

      {(!projects || projects.length === 0) && (
        <Text className="text-mobile-secondary text-muted-foreground px-4">
          No projects found.
        </Text>
      )}

      <Card className="mx-4 py-0 overflow-hidden">
        {(projects ?? []).map((project) => (
          <Pressable
            key={project.id}
            onPress={() => handleNavigate(project.externalRef)}
            className="flex-row items-center px-4 py-3 active:opacity-70"
          >
            <View className="flex-1">
              <Text className="text-mobile-secondary text-foreground">{project.name}</Text>
              <Text className="text-mobile-caption text-muted-foreground">
                {project.externalRef}
              </Text>
            </View>
            {project.externalRef === currentProjectRef && (
              <Check size={16} color="#22c55e" className="mr-2" />
            )}
            <ChevronRight size={18} color="#4B5563" />
          </Pressable>
        ))}
      </Card>
    </View>
  );
}
