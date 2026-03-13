import React, { useCallback, useState } from 'react';
import { ScrollView, View, RefreshControl } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { MissingSecretKey } from '@/components/shared/missing-secret-key';
import { DeploymentCard } from '@/components/deployments/deployment-card';
import { ContentContainer } from '@/components/layout';
import { useDeployments } from '@/hooks/api/use-deployments';
import { useEnvironment } from '@/hooks/use-environment';
import { usePreferencesStore, type Environment } from '@/stores/preferences-store';
import { MissingSecretKeyError } from '@/lib/errors';
import { ENV_LABELS, ENV_COLORS } from '@/lib/environment';
import { PackageX, Rocket } from 'lucide-react-native';
import type { DeploymentListItem } from '@/services/api/deployments';

function DeploymentSkeleton() {
  return (
    <View className="gap-3 p-4">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="gap-2 py-3 px-3">
          <View className="flex-row items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <View className="flex-1" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </View>
          <View className="flex-row items-center gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </View>
        </Card>
      ))}
    </View>
  );
}

export default function DeploymentsSettingsScreen() {
  const router = useRouter();
  const { currentEnvironment, availableEnvironments, setEnvironment } = useEnvironment();
  const selectedEnvironment = usePreferencesStore((s) => s.selectedEnvironment);
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useDeployments();

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refetch]);

  const handleDeploymentPress = useCallback(
    (dep: DeploymentListItem) => {
      if (dep.id) {
        router.push(`/(dashboard)/(settings)/deployment/${dep.id}`);
      }
    },
    [router]
  );

  const envToolbar = (
    <EnvironmentToolbar
      currentEnvironment={currentEnvironment}
      availableEnvironments={availableEnvironments}
      setEnvironment={setEnvironment}
    />
  );

  if (selectedEnvironment === 'dev') {
    return (
      <View className="flex-1 bg-background">
        <EmptyState
          icon={Rocket}
          title="Not available in Dev"
          description="Deployments are not available in the Dev environment. Switch to a different environment to view your deployments."
        />
        {envToolbar}
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-background" accessibilityLabel="Loading deployments" accessibilityRole="progressbar">
        <DeploymentSkeleton />
        {envToolbar}
      </View>
    );
  }

  if (isError) {
    if (error instanceof MissingSecretKeyError) {
      return (
        <View className="flex-1 bg-background">
          <MissingSecretKey feature="deployments" />
          {envToolbar}
        </View>
      );
    }

    return (
      <View className="flex-1 bg-background items-center justify-center px-4">
        <Card className="w-full">
          <CardContent>
            <Text variant="h4" className="text-center mb-2">
              Something went wrong
            </Text>
            <Text variant="muted" className="text-center mb-4">
              {error?.message ?? 'Failed to load deployments'}
            </Text>
            <Button variant="outline" onPress={() => refetch()}>
              <Text>Try again</Text>
            </Button>
          </CardContent>
        </Card>
        {envToolbar}
      </View>
    );
  }

  const deployments = data?.data ?? [];

  if (deployments.length === 0) {
    return (
      <View className="flex-1 bg-background">
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={isManualRefreshing} onRefresh={handleRefresh} />
          }
        >
          <EmptyState
            icon={PackageX}
            title="No deployments yet"
            description="Deploy your project to see deployment status here."
          />
        </ScrollView>
        {envToolbar}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 12 }}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={isManualRefreshing} onRefresh={handleRefresh} />
        }
      >
        <ContentContainer variant="reading">
          <View className="px-4 tablet:px-8 gap-3 pb-4">
            {deployments.map((dep) => (
              <DeploymentCard
                key={dep.id}
                deployment={dep}
                onPress={handleDeploymentPress}
              />
            ))}
          </View>
        </ContentContainer>
      </ScrollView>
      {envToolbar}
    </View>
  );
}

function EnvironmentToolbar({
  currentEnvironment,
  availableEnvironments,
  setEnvironment,
}: {
  currentEnvironment: Environment;
  availableEnvironments: Environment[];
  setEnvironment: (env: Environment) => void;
}) {
  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Menu icon="circle.fill" tintColor={ENV_COLORS[currentEnvironment]} separateBackground>
        {availableEnvironments.map((env) => (
          <Stack.Toolbar.MenuAction
            key={env}
            isOn={env === currentEnvironment}
            onPress={() => setEnvironment(env)}
          >
            {ENV_LABELS[env]}
          </Stack.Toolbar.MenuAction>
        ))}
      </Stack.Toolbar.Menu>
    </Stack.Toolbar>
  );
}
