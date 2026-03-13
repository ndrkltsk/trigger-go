import React from 'react';
import { ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { ProjectSelector } from '@/components/shared/project-selector';
import { ContentContainer } from '@/components/layout';

export default function ProjectsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Projects' }} />
      <ScrollView className="flex-1 bg-background pt-4 pb-8">
        <ContentContainer variant="reading">
          <ProjectSelector />
        </ContentContainer>
      </ScrollView>
    </>
  );
}
