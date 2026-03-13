import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, View } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { FlashList } from '@shopify/flash-list';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Icon } from '@/components/ui/icon';
import { RunCard } from '@/components/runs/run-card';
import { JsonViewer } from '@/components/shared/json-viewer';
import { ContentContainer } from '@/components/layout';
import { TriggerTaskSheet, type TriggerTaskSheetRef } from '@/components/tasks/trigger-task-sheet';
import { useTasksList } from '@/hooks/api/use-tasks';
import { useTaskRuns } from '@/hooks/api/use-task-runs';
import { useToast } from '@/stores/toast-store';
import { formatDateTime } from '@/lib/format';
import {
  FileCode,
  Braces,
  Play,
  Inbox,
  Zap,
} from 'lucide-react-native';
import type { ListRunItem } from '@/services/api/runs';
import { posthogCapture } from '@/services/posthog';

function TaskDetailSkeleton() {
  return (
    <View className="flex-1 bg-background">
      <View className="px-4 py-4 gap-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
        <View className="mt-2 gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-52" />
        </View>
        <View className="mt-4 gap-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </View>
      </View>
    </View>
  );
}

function RunCardSkeleton() {
  return (
    <View className="bg-card border-border mx-4 mb-1.5 rounded-md border py-3 px-4">
      <View className="flex-row items-center gap-2 mb-1">
        <Skeleton className="h-4 w-32" />
      </View>
      <View className="flex-row items-center gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </View>
    </View>
  );
}

export default function TaskDetailScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const triggerSheetRef = useRef<TriggerTaskSheetRef>(null);

  const { tasks, isLoading: isLoadingTasks, refetch: refetchTasks } = useTasksList();
  const {
    data: runsPages,
    isLoading: isLoadingRuns,
    isError: isRunsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchRuns,
  } = useTaskRuns(taskId);

  const { showToast } = useToast();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const task = useMemo(
    () => tasks.find((t) => t.slug === taskId),
    [tasks, taskId]
  );

  useEffect(() => {
    if (task) {
      posthogCapture('task viewed', { task_id: taskId });
    }
  }, [taskId, task]);

  const recentRuns = useMemo(
    () => runsPages?.pages.flatMap((p) => p.data ?? []) ?? [],
    [runsPages]
  );

  const handleCopySlug = useCallback(() => {
    Clipboard.setStringAsync(taskId);
    showToast({ type: 'success', title: 'Task ID copied' });
  }, [taskId, showToast]);

  const handleRunPress = useCallback(
    (run: ListRunItem) => {
      router.push(`/(dashboard)/(runs)/${run.id}`);
    },
    [router]
  );

  const handleOpenTrigger = useCallback(() => {
    posthogCapture('task triggered', { task_identifier: taskId });
    triggerSheetRef.current?.present(taskId);
  }, [taskId]);

  const handleRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([refetchTasks(), refetchRuns()]);
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refetchTasks, refetchRuns]);

  if (isLoadingTasks) {
    return (
      <View className="flex-1 bg-background">
        <Stack.Screen options={{ title: 'Loading...' }} />
        <TaskDetailSkeleton />
      </View>
    );
  }

  if (!task) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Stack.Screen options={{ title: 'Not Found' }} />
        <Text className="text-destructive text-center mb-4">
          Task &quot;{taskId}&quot; not found in the current worker.
        </Text>
        <Button variant="outline" onPress={() => router.back()}>
          <Text className="text-sm font-medium">Go Back</Text>
        </Button>
      </View>
    );
  }

  const renderRunItem = ({ item }: { item: ListRunItem }) => (
    <ContentContainer variant="reading">
      <RunCard run={item} onPress={() => handleRunPress(item)} />
    </ContentContainer>
  );

  const ListHeader = (
    <ContentContainer variant="reading">
    <View>
      {/* Task Info Header */}
      <View className="px-4 tablet:px-8 py-4">
        {/* Task name */}
        <View className="flex-row items-center gap-2 mb-1">
          <Icon as={FileCode} size={20} className="text-primary" />
          <Text className="text-lg font-bold text-foreground flex-1" numberOfLines={1}>
            {task.slug}
          </Text>
        </View>

        {/* Badges row */}
        <View className="flex-row items-center gap-2 mb-3 flex-wrap">
          {task.triggerSource && (
            <Badge variant="secondary" className="px-2 py-0.5">
              <Icon as={Zap} size={10} className="text-muted-foreground mr-1" />
              <Text className="text-[11px]">{task.triggerSource}</Text>
            </Badge>
          )}
          {task.exportName && (
            <Badge variant="secondary" className="px-2 py-0.5">
              <Text className="text-[11px]">{task.exportName}</Text>
            </Badge>
          )}
          {task.payloadSchema && (
            <Badge variant="outline" className="px-2 py-0.5">
              <Icon as={Braces} size={10} className="text-muted-foreground mr-1" />
              <Text className="text-[11px] text-muted-foreground">Schema</Text>
            </Badge>
          )}
        </View>

        {/* Info rows */}
        <View className="border-t border-border pt-2">
          {task.filePath && (
            <View className="flex-row items-baseline justify-between py-1.5">
              <Text className="text-xs text-muted-foreground">File</Text>
              <Text className="text-xs text-foreground max-w-[65%] text-right" numberOfLines={1}>
                {task.filePath}
              </Text>
            </View>
          )}
          {task.createdAt && (
            <View className="flex-row items-baseline justify-between py-1.5">
              <Text className="text-xs text-muted-foreground">Registered</Text>
              <Text className="text-xs text-foreground">
                {formatDateTime(task.createdAt)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Payload Schema */}
      {task.payloadSchema && (
        <View className="px-4 pb-3">
          <JsonViewer data={task.payloadSchema} title="Payload Schema" defaultCollapsed />
        </View>
      )}

      {/* Last Runs header */}
      <View className="px-4 pt-2 pb-2 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-foreground">Last Runs</Text>
      </View>

      {/* Runs loading skeleton */}
      {isLoadingRuns && (
        <View>
          {Array.from({ length: 3 }, (_, i) => (
            <RunCardSkeleton key={i} />
          ))}
        </View>
      )}

      {/* Runs error */}
      {isRunsError && !isLoadingRuns && (
        <View className="mx-4 mb-3 rounded-lg bg-destructive/10 px-4 py-3">
          <Text className="text-xs text-destructive text-center">
            Failed to load runs
          </Text>
        </View>
      )}

      {/* Empty runs */}
      {!isLoadingRuns && !isRunsError && recentRuns.length === 0 && (
        <View className="mx-4 mb-3 rounded-lg bg-muted/30 px-4 py-6 items-center">
          <Icon as={Inbox} size={32} className="text-muted-foreground mb-2" color="#8B95A5" />
          <Text className="text-sm text-muted-foreground text-center">
            No runs yet for this task
          </Text>
          <Text className="text-xs text-muted-foreground text-center mt-1">
            Trigger the task to create your first run
          </Text>
        </View>
      )}
    </View>
    </ContentContainer>
  );

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: task.slug,
        }}
      />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="ellipsis">
          <Stack.Toolbar.MenuAction icon="doc.on.doc" onPress={handleCopySlug}>
            Copy Task ID
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      <FlashList
        data={!isLoadingRuns && !isRunsError ? recentRuns : []}
        renderItem={renderRunItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: 140 }}
        contentInsetAdjustmentBehavior="automatic"
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isManualRefreshing}
            onRefresh={handleRefresh}
          />
        }
      />

      {/* Bottom action bar */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-border bg-card px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <Button
          variant="default"
          onPress={handleOpenTrigger}
          className="w-full"
          accessibilityRole="button"
          accessibilityLabel="Trigger task"
        >
          <Play size={16} color="#fff" />
          <Text className="text-sm font-medium text-primary-foreground">Trigger</Text>
        </Button>
      </View>

      <TriggerTaskSheet ref={triggerSheetRef} />
    </View>
  );
}
