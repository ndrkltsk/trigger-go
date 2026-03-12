import React, { forwardRef, useImperativeHandle, useRef, useState, useCallback } from 'react';
import { Platform, ScrollView, View, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FolderKanban, RefreshCw } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { BottomSheet, type BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '@/components/ui/bottom-sheet/bottom-sheet-header';
import { fetchProjects, type Project } from '@/services/api/projects';

export interface ProjectPickerSheetRef {
  present: () => void;
  dismiss: () => void;
}

interface ProjectPickerSheetProps {
  onSelect: (project: Project) => void;
}

const isIPad = Platform.OS === 'ios' && Platform.isPad;

export const ProjectPickerSheet = forwardRef<ProjectPickerSheetRef, ProjectPickerSheetProps>(
  ({ onSelect }, ref) => {
    const sheetRef = useRef<BottomSheetRef>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const insets = useSafeAreaInsets();
    const bottomInset = isIPad ? 0 : insets.bottom;
    const { height } = useWindowDimensions();

    const loadProjects = useCallback(async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const data = await fetchProjects();
        setProjects(data);
      } catch {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }, []);

    useImperativeHandle(ref, () => ({
      present: () => {
        loadProjects();
        sheetRef.current?.present();
      },
      dismiss: () => {
        sheetRef.current?.dismiss();
      },
    }));

    // Group projects by organization
    const grouped = projects.reduce<Record<string, { org: string; projects: Project[] }>>(
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
      <BottomSheet
        ref={sheetRef}
        scrollable
        maxContentHeight={height * 0.6}
        header={<BottomSheetHeader title="Select Project" />}
      >
        <ScrollView nestedScrollEnabled className="px-4 pt-2" contentContainerStyle={{ paddingBottom: bottomInset + 16 }}>
          {isLoading && (
            <View className="items-center py-8">
              <ActivityIndicator size="large" />
              <Text className="text-xs text-muted-foreground mt-3">Loading projects...</Text>
            </View>
          )}

          {isError && (
            <View className="items-center py-8 gap-3">
              <Text className="text-sm text-muted-foreground">Failed to load projects.</Text>
              <Button onPress={loadProjects} variant="outline" size="sm">
                <View className="flex-row items-center gap-2">
                  <Icon as={RefreshCw} className="text-foreground" size={14} />
                  <Text className="text-sm">Retry</Text>
                </View>
              </Button>
            </View>
          )}

          {!isLoading && !isError && projects.length === 0 && (
            <View className="items-center py-8">
              <Text className="text-sm text-muted-foreground">No projects found.</Text>
            </View>
          )}

          {!isLoading && !isError && Object.entries(grouped).map(([orgSlug, { org, projects: orgProjects }]) => (
            <View key={orgSlug} className="mb-2">
              <Text className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                {org}
              </Text>
              {orgProjects.map((project) => (
                <Pressable
                  key={project.id}
                  onPress={() => onSelect(project)}
                  className="flex-row items-center py-3 px-1 active:opacity-70"
                >
                  <Icon as={FolderKanban} className="text-primary mr-3" size={20} />
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">{project.name}</Text>
                    <Text className="text-xs text-muted-foreground">{project.externalRef}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      </BottomSheet>
    );
  }
);

ProjectPickerSheet.displayName = 'ProjectPickerSheet';
