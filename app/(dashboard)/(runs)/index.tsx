import { useCallback, useMemo, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { AnimatedRunCard } from '@/components/runs/animated-run-card';
import { RunCardSkeletonList } from '@/components/runs/run-card-skeleton';
import { RunFilters } from '@/components/runs/run-filters';
import { EmptyState } from '@/components/shared/empty-state';
import { ContentContainer } from '@/components/layout';
import { useRuns } from '@/hooks/api/use-runs';
import { useTasksList } from '@/hooks/api/use-tasks';
import { useFiltersStore, hasActiveFilters } from '@/stores/filters-store';
import { Inbox, SearchX } from 'lucide-react-native';
import { TriggerTaskSheet, type TriggerTaskSheetRef } from '@/components/tasks/trigger-task-sheet';
import type { ListRunItem } from '@/services/api/runs';

export default function RunsListScreen() {
  const router = useRouter();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRuns();

  // Refetch when the screen gains focus (e.g. navigating back from run detail)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const triggerSheetRef = useRef<TriggerTaskSheetRef>(null);

  const { tasks: workerTasks } = useTasksList();
  const deploymentTasks = workerTasks.map((t) => t.slug);

  const listRef = useRef<FlashListRef<ListRunItem>>(null);
  const seenRunIdsRef = useRef<Set<string> | null>(null);
  const scrollOffsetRef = useRef(0);

  const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
  }, []);

  const runs = useMemo(
    () => data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [data]
  );

  // Compute new run IDs synchronously so they're available in the same render pass.
  // This ensures AnimatedRunCard receives isNew=true on the first render with new data,
  // preventing items from flashing visible before the animation starts.
  const newRunIds = useMemo(() => {
    if (runs.length === 0) return new Set<string>();

    const seen = seenRunIdsRef.current;

    // First load — seed known set, no animations
    if (!seen) {
      seenRunIdsRef.current = new Set(runs.map((r) => r.id));
      return new Set<string>();
    }

    const fresh = new Set<string>();
    for (const run of runs) {
      if (!seen.has(run.id)) fresh.add(run.id);
    }

    seenRunIdsRef.current = new Set(runs.map((r) => r.id));

    if (fresh.size > 0 && scrollOffsetRef.current < 200) {
      // Auto-scroll to top only when user is near the top of the list
      setTimeout(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }), 0);
    }

    return fresh;
  }, [runs]);

  const filtersActive = hasActiveFilters();

  const availableTasks = useMemo(() => {
    const fromRuns = runs.map((r) => r.taskIdentifier);
    return [...new Set([...fromRuns, ...deploymentTasks])].sort();
  }, [runs, deploymentTasks]);

  const availableTags = useMemo(
    () => [...new Set(runs.flatMap((r) => r.tags ?? []))].sort(),
    [runs]
  );

  const handleRunPress = useCallback(
    (run: ListRunItem) => {
      router.push(`/(dashboard)/(runs)/${run.id}`);
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: ListRunItem }) => (
      <ContentContainer>
        <AnimatedRunCard
          run={item}
          onPress={() => handleRunPress(item)}
          isNew={newRunIds.has(item.id)}
        />
      </ContentContainer>
    ),
    [handleRunPress, newRunIds]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);


  if (isLoading) {
    return (
      <View className="flex-1 bg-background" accessibilityLabel="Loading runs" accessibilityRole="progressbar">
        <ContentContainer>
          <RunFilters availableTasks={[]} availableTags={[]} />
          <RunCardSkeletonList count={5} />
        </ContentContainer>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-background">
        <ContentContainer>
          <RunFilters availableTasks={availableTasks} availableTags={availableTags} />
        </ContentContainer>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-destructive text-center mb-4">
            {error?.message ?? 'Failed to load runs'}
          </Text>
          <Button variant="outline" onPress={() => refetch()}>
            <Text className="text-sm font-medium">Try again</Text>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ContentContainer>
        <RunFilters availableTasks={availableTasks} availableTags={availableTags} />
      </ContentContainer>
        <FlashList
          ref={listRef}
          data={runs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingTop: 8 }}
          contentInsetAdjustmentBehavior="automatic"
          onRefresh={async () => {
            setIsManualRefreshing(true);
            try {
              await refetch();
            } finally {
              setIsManualRefreshing(false);
            }
          }}
          refreshing={isManualRefreshing}
          extraData={{ newRunIds }}
          accessibilityLabel={`Runs list, ${runs.length} items`}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator />
              </View>
            ) : null
          }
          ListEmptyComponent={
            filtersActive ? (
              <EmptyState
                icon={SearchX}
                title="No matching runs"
                description="Try adjusting your filters to find what you are looking for."
                actionLabel="Clear filters"
                onAction={() => useFiltersStore.getState().clearAllFilters()}
              />
            ) : (
              <EmptyState
                icon={Inbox}
                title="No runs yet"
                description="Trigger a task to see your runs appear here."
              />
            )
          }
        />

      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="plus" onPress={() => triggerSheetRef.current?.present()} />
      </Stack.Toolbar>

      <TriggerTaskSheet ref={triggerSheetRef} />
    </View>
  );
}
