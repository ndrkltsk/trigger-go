import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, ActivityIndicator, RefreshControl } from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useRouter, Stack } from 'expo-router';
import { useEnvironment } from '@/hooks/use-environment';
import { Text } from '@/components/ui/text';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { MissingSecretKey } from '@/components/shared/missing-secret-key';
import { ContentContainer } from '@/components/layout';
import { ScheduleCard } from '@/components/schedules/schedule-card';
import { ScheduleFormSheet, type ScheduleFormSheetRef, type ScheduleFormValues } from '@/components/schedules/schedule-form-sheet';
import { useSchedules, useCreateSchedule, useTimezones } from '@/hooks/api/use-schedules';
import { useTasksList } from '@/hooks/api/use-tasks';
import { useToast } from '@/stores/toast-store';
import { MissingSecretKeyError } from '@/lib/errors';
import { CalendarOff } from 'lucide-react-native';
import type { ScheduleObject } from '@/services/api/schedules';
import { ENV_LABELS, ENV_COLORS } from '@/lib/environment';

function ScheduleCardSkeleton() {
  return (
    <Card className="gap-2 py-3 px-3">
      <View className="flex-row items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-36" />
        <View className="flex-1" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </View>
      <View className="flex-row items-center gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-32" />
      </View>
      <View className="flex-row items-center gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-28" />
      </View>
    </Card>
  );
}

function ScheduleSkeletonList() {
  return (
    <View className="gap-3 p-4">
      {Array.from({ length: 4 }, (_, i) => (
        <ScheduleCardSkeleton key={i} />
      ))}
    </View>
  );
}

export default function SchedulesListScreen() {
  const router = useRouter();
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSchedules();
  const createSchedule = useCreateSchedule();
  const { data: timezones } = useTimezones();
  const { tasks: workerTasks } = useTasksList();
  const { showToast } = useToast();
  const { currentEnvironment, availableEnvironments, setEnvironment } = useEnvironment();

  const formSheetRef = useRef<ScheduleFormSheetRef>(null);
  const listRef = useRef<FlashListRef<ScheduleObject>>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const schedules = useMemo(
    () => data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [data]
  );

  const availableTasks = useMemo(
    () => workerTasks
      .filter((t) => t.triggerSource === 'SCHEDULED')
      .map((t) => t.slug)
      .sort(),
    [workerTasks]
  );

  const handleFormSubmit = useCallback(
    async (mode: 'create' | 'edit', values: ScheduleFormValues) => {
      if (mode === 'create') {
        await createSchedule.mutateAsync({
          task: values.task,
          cron: values.cron,
          timezone: values.timezone,
          deduplicationKey: values.deduplicationKey || values.task,
          externalId: values.externalId || undefined,
        });
        showToast({ type: 'success', title: 'Schedule created' });
        setTimeout(() => {
          listRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 300);
      }
    },
    [createSchedule, showToast]
  );

  const handleSchedulePress = useCallback(
    (schedule: ScheduleObject) => {
      if (schedule.id) {
        router.push(`/(dashboard)/(settings)/schedule/${schedule.id}`);
      }
    },
    [router]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: ScheduleObject }) => (
      <ContentContainer variant="reading">
        <View className="px-4 tablet:px-8 pb-3">
          <ScheduleCard schedule={item} onPress={handleSchedulePress} />
        </View>
      </ContentContainer>
    ),
    [handleSchedulePress]
  );

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator />
      </View>
    );
  }, [isFetchingNextPage]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <EmptyState
        icon={CalendarOff}
        title="No schedules"
        description="Create a schedule or deploy tasks with schedule configuration to see them here."
      />
    );
  }, [isLoading]);

  if (isLoading || (isFetching && isError)) {
    return (
      <View className="flex-1 bg-background" accessibilityLabel="Loading schedules" accessibilityRole="progressbar">
        <ScheduleSkeletonList />
      </View>
    );
  }

  if (isError) {
    if (error instanceof MissingSecretKeyError) {
      return <MissingSecretKey feature="schedules" />;
    }

    return (
      <View className="flex-1 bg-background items-center justify-center px-4">
        <Card className="w-full">
          <CardContent>
            <Text variant="h4" className="text-center mb-2">
              Something went wrong
            </Text>
            <Text variant="muted" className="text-center mb-4">
              {error?.message ?? 'Failed to load schedules'}
            </Text>
            <Button variant="outline" onPress={() => refetch()}>
              <Text>Try again</Text>
            </Button>
          </CardContent>
        </Card>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlashList
        ref={listRef}
        data={schedules}
        renderItem={renderItem}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
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
        keyExtractor={(item) => item.id ?? ''}
        accessibilityLabel={`Schedules list, ${schedules.length} items`}
      />
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
        <Stack.Toolbar.Button icon="plus" onPress={() => formSheetRef.current?.presentCreate()} separateBackground />
      </Stack.Toolbar>

      <ScheduleFormSheet
        ref={formSheetRef}
        availableTasks={availableTasks}
        timezones={timezones ?? []}
        onSubmit={handleFormSubmit}
        isPending={createSchedule.isPending}
      />
    </View>
  );
}
