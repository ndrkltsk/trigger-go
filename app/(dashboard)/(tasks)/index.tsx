import React, { useCallback, useState } from 'react';
import { View, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { TaskCard } from '@/components/tasks/task-card';
import { ContentContainer } from '@/components/layout';
import { useTasksList, type TaskListItem } from '@/hooks/api/use-tasks';
import { useEnvironment } from '@/hooks/use-environment';
import { ApiError } from '@/lib/errors';
import { ServerOff, PackageOpen } from 'lucide-react-native';

function TaskCardSkeleton() {
  return (
    <View className="bg-card border-border mx-4 mb-1.5 rounded-md border py-3 px-4">
      <View className="flex-row items-center gap-2 mb-1">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-40" />
        <View className="flex-1" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </View>
      <Skeleton className="h-3 w-56 mb-1" />
      <View className="flex-row items-center gap-3">
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </View>
    </View>
  );
}

function TaskSkeletonList() {
  return (
    <View className="pt-3">
      {Array.from({ length: 6 }, (_, i) => (
        <TaskCardSkeleton key={i} />
      ))}
    </View>
  );
}

function WorkerInfoBanner({ version, sdkVersion, engine, taskCount }: {
  version?: string;
  sdkVersion?: string;
  engine?: string;
  taskCount: number;
}) {
  return (
    <View className="mx-4 mb-3 flex-row items-center gap-2 flex-wrap">
      {version && (
        <Badge variant="outline" className="px-2 py-0.5">
          <Text className="text-[11px] text-muted-foreground">v{version}</Text>
        </Badge>
      )}
      {sdkVersion && (
        <Badge variant="outline" className="px-2 py-0.5">
          <Text className="text-[11px] text-muted-foreground">SDK {sdkVersion}</Text>
        </Badge>
      )}
      {engine && (
        <Badge variant="outline" className="px-2 py-0.5">
          <Text className="text-[11px] text-muted-foreground">{engine}</Text>
        </Badge>
      )}
      <View className="flex-1" />
      <Text className="text-[12px] text-muted-foreground">
        {taskCount} task{taskCount !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}

export default function TasksListScreen() {
  const router = useRouter();
  const { currentEnvironment } = useEnvironment();
  const {
    tasks,
    workerInfo,
    isLoading,
    isError,
    error,
    refetch,
    deploymentVersion,
  } = useTasksList();

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const handleTaskPress = useCallback(
    (task: TaskListItem) => {
      router.push(`/(dashboard)/(tasks)/${task.slug}`);
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: TaskListItem }) => (
      <ContentContainer>
        <TaskCard task={item} onPress={handleTaskPress} />
      </ContentContainer>
    ),
    [handleTaskPress]
  );

  if (isLoading) {
    return (
      <View
        className="flex-1 bg-background"
        accessibilityLabel="Loading tasks"
        accessibilityRole="progressbar"
      >
        <ContentContainer>
          <TaskSkeletonList />
        </ContentContainer>
      </View>
    );
  }

  if (isError) {
    if (error instanceof ApiError && error.isNotFound) {
      return (
        <View className="flex-1 bg-background">
          <EmptyState
            icon={PackageOpen}
            title="No worker deployed"
            description={`No worker has been deployed to the ${currentEnvironment} environment yet. Deploy your tasks to get started.`}
          />
        </View>
      );
    }

    return (
      <View className="flex-1 bg-background items-center justify-center px-4">
        <ContentContainer variant="form">
          <Card className="w-full">
            <CardContent>
              <Text variant="h4" className="text-center mb-2">
                Something went wrong
              </Text>
              <Text variant="muted" className="text-center mb-4">
                {error?.message ?? 'Failed to load tasks'}
              </Text>
              <Button variant="outline" onPress={() => refetch()}>
                <Text>Try again</Text>
              </Button>
            </CardContent>
          </Card>
        </ContentContainer>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
        <FlashList
          data={tasks}
          renderItem={renderItem}
          keyExtractor={(item) => item.id || item.slug}
          contentContainerStyle={{ paddingTop: 12 }}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              refreshing={isManualRefreshing}
              onRefresh={async () => {
                setIsManualRefreshing(true);
                try {
                  await refetch();
                } finally {
                  setIsManualRefreshing(false);
                }
              }}
            />
          }
          ListHeaderComponent={
            (workerInfo || deploymentVersion) ? (
              <WorkerInfoBanner
                version={workerInfo?.version ?? deploymentVersion}
                sdkVersion={workerInfo?.sdkVersion}
                engine={workerInfo?.engine}
                taskCount={tasks.length}
              />
            ) : tasks.length > 0 ? (
              <View className="mx-4 mb-3 flex-row justify-end">
                <Text className="text-[12px] text-muted-foreground">
                  {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon={ServerOff}
              title="No tasks found"
              description={`No tasks registered for the ${currentEnvironment} environment. Deploy your tasks first.`}
            />
          }
          accessibilityLabel={`Tasks list, ${tasks.length} items`}
        />
    </View>
  );
}
