import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Icon } from '@/components/ui/icon';
import { ConfirmSheet, type ConfirmSheetRef } from '@/components/shared/confirm-sheet';
import { ScheduleFormSheet, type ScheduleFormSheetRef, type ScheduleFormValues } from '@/components/schedules/schedule-form-sheet';
import { cronToHuman } from '@/lib/cron';
import { formatDateTime, formatRelativeTime } from '@/lib/format';
import { useSchedule, useToggleScheduleActive, useDeleteSchedule, useUpdateSchedule, useTimezones } from '@/hooks/api/use-schedules';
import { useTasksList } from '@/hooks/api/use-tasks';
import { useToast } from '@/stores/toast-store';
import { Info, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { posthogCapture } from '@/services/posthog';

function MetadataRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-baseline justify-between py-1.5">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text
        className="text-xs text-foreground"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function ScheduleDetailSkeleton() {
  return (
    <View className="flex-1 bg-background">
      <View className="px-4 py-4 gap-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-64 mt-2" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-52" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-44" />
      </View>
    </View>
  );
}

export default function ScheduleDetailScreen() {
  const { scheduleId } = useLocalSearchParams<{ scheduleId: string }>();
  const router = useRouter();
  const { data: schedule, isLoading, isError, error, refetch } = useSchedule(scheduleId);
  const toggleActive = useToggleScheduleActive();
  const deleteScheduleMutation = useDeleteSchedule();
  const updateSchedule = useUpdateSchedule();
  const { data: timezones } = useTimezones();
  const { tasks: workerTasks } = useTasksList();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const formSheetRef = useRef<ScheduleFormSheetRef>(null);
  const deleteSheetRef = useRef<ConfirmSheetRef>(null);
  useEffect(() => {
    if (schedule) {
      posthogCapture('schedule viewed', { schedule_id: scheduleId });
    }
  }, [scheduleId, schedule]);

  const handleCopyScheduleId = () => {
    Clipboard.setStringAsync(scheduleId);
    showToast({ type: 'success', title: 'Schedule ID copied' });
  };

  const availableTasks = useMemo(() => {
    const scheduled = workerTasks
      .filter((t) => t.triggerSource === 'SCHEDULED')
      .map((t) => t.slug);
    // Include the current schedule's task even if not in worker list
    if (schedule?.task && !scheduled.includes(schedule.task)) {
      scheduled.push(schedule.task);
    }
    return scheduled.sort();
  }, [workerTasks, schedule?.task]);

  const handleEdit = useCallback(() => {
    if (!schedule) return;
    formSheetRef.current?.presentEdit({
      task: schedule.task ?? '',
      cron: schedule.generator?.expression ?? '',
      timezone: schedule.timezone ?? 'UTC',
      deduplicationKey: schedule.deduplicationKey ?? '',
      externalId: schedule.externalId ?? '',
    });
  }, [schedule]);

  const handleFormSubmit = useCallback(
    async (mode: 'create' | 'edit', values: ScheduleFormValues) => {
      if (mode === 'edit') {
        await updateSchedule.mutateAsync({
          scheduleId,
          options: {
            task: values.task,
            cron: values.cron,
            timezone: values.timezone,
            externalId: values.externalId || undefined,
          },
        });
        showToast({ type: 'success', title: 'Schedule updated' });
      }
    },
    [scheduleId, updateSchedule, showToast]
  );

  const handleDelete = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await deleteScheduleMutation.mutateAsync(scheduleId);
      deleteSheetRef.current?.dismiss();
      showToast({ type: 'success', title: 'Schedule deleted' });
      router.back();
    } catch {
      showToast({ type: 'error', title: 'Failed to delete schedule' });
    }
  }, [deleteScheduleMutation, scheduleId, showToast, router]);

  const isDeclarative = schedule?.type === 'DECLARATIVE';
  const cronExpression = schedule?.generator?.expression;
  const humanDescription =
    schedule?.generator?.description ??
    (cronExpression ? cronToHuman(cronExpression) : null);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <Stack.Screen options={{ title: 'Loading...' }} />
        <ScheduleDetailSkeleton />
      </View>
    );
  }

  if (isError || !schedule) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Stack.Screen options={{ title: 'Error' }} />
        <Text className="text-destructive text-center mb-4">
          {error?.message ?? 'Schedule not found'}
        </Text>
        <Button variant="outline" onPress={() => refetch()}>
          <Text className="text-sm font-medium">Try again</Text>
        </Button>
      </View>
    );
  }

  const scheduleName = schedule.externalId ?? schedule.task ?? schedule.id ?? 'Schedule';

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: scheduleName }} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="ellipsis">
          <Stack.Toolbar.MenuAction icon="doc.on.doc" onPress={handleCopyScheduleId}>
            Copy Schedule ID
          </Stack.Toolbar.MenuAction>
          {!isDeclarative && (
            <Stack.Toolbar.MenuAction icon="pencil" onPress={handleEdit}>
              Edit Schedule
            </Stack.Toolbar.MenuAction>
          )}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      <ScrollView className="flex-1" contentInsetAdjustmentBehavior="automatic">
        {/* Header */}
        <View className="px-4 py-4">
          <Text className="text-lg font-bold text-foreground mb-1">
            {scheduleName}
          </Text>
          <View className="flex-row items-center gap-2 mb-3">
            <Badge
              variant={schedule.active ? 'default' : 'secondary'}
              className={
                schedule.active
                  ? 'bg-status-success/15 border-transparent'
                  : 'border-transparent'
              }
            >
              <Text
                className={`text-xs font-semibold ${
                  schedule.active ? 'text-status-success' : 'text-muted-foreground'
                }`}
              >
                {schedule.active ? 'Active' : 'Inactive'}
              </Text>
            </Badge>
            <Badge variant="outline" className="px-1.5 py-0">
              <Text className="text-xs text-muted-foreground">
                {isDeclarative ? 'Managed by code' : 'Custom'}
              </Text>
            </Badge>
          </View>
        </View>

        {/* Configuration card */}
        <View className="px-4 pb-3">
          <Card>
            <CardContent className="py-3">
              <View className="border-b border-border pb-2 mb-1">
                <Text className="text-sm font-semibold text-foreground">
                  Configuration
                </Text>
              </View>

              <MetadataRow label="Schedule ID" value={schedule.id ?? '--'} />

              {schedule.task && (
                <MetadataRow label="Task" value={schedule.task} />
              )}

              {cronExpression && (
                <MetadataRow label="Cron" value={cronExpression} />
              )}

              {humanDescription && (
                <MetadataRow label="Frequency" value={humanDescription} />
              )}

              <MetadataRow
                label="Timezone"
                value={schedule.timezone ?? 'UTC'}
              />

              {schedule.deduplicationKey && (
                <MetadataRow
                  label="Dedup Key"
                  value={schedule.deduplicationKey}
                />
              )}

              {schedule.externalId && (
                <MetadataRow
                  label="External ID"
                  value={schedule.externalId}
                />
              )}

              {schedule.nextRun && (
                <>
                  <MetadataRow
                    label="Next Run"
                    value={formatDateTime(schedule.nextRun)}
                  />
                  <MetadataRow
                    label=""
                    value={formatRelativeTime(schedule.nextRun)}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </View>

        {/* Info banner for code-managed schedules */}
        {isDeclarative && (
          <View className="px-4 pb-3">
            <View className="flex-row items-start gap-2 rounded-lg bg-muted/50 px-4 py-3">
              <Icon as={Info} size={16} className="text-muted-foreground mt-0.5" />
              <Text className="text-xs text-muted-foreground flex-1">
                This schedule is managed by code and cannot be edited from the app.
              </Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Sticky bottom footer for custom schedules */}
      {!isDeclarative && (
        <View
          className="border-t border-border bg-card px-4 pt-3 flex-row gap-2"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <Button
            variant="outline"
            className="flex-1"
            disabled={toggleActive.isPending}
            onPress={() =>
              toggleActive.mutate({
                scheduleId: schedule.id!,
                active: schedule.active ?? false,
              })
            }
          >
            <Text className="text-sm text-foreground">
              {toggleActive.isPending
                ? schedule.active
                  ? 'Deactivating...'
                  : 'Activating...'
                : schedule.active
                  ? 'Deactivate'
                  : 'Activate'}
            </Text>
          </Button>
          <Button
            variant="destructive"
            disabled={deleteScheduleMutation.isPending}
            onPress={() => deleteSheetRef.current?.present()}
          >
            <Trash2 size={18} color="#fff" />
          </Button>
        </View>
      )}

      <ScheduleFormSheet
        ref={formSheetRef}
        availableTasks={availableTasks}
        timezones={timezones ?? []}
        onSubmit={handleFormSubmit}
        isPending={updateSchedule.isPending}
      />

      <ConfirmSheet
        ref={deleteSheetRef}
        title="Delete this schedule?"
        description="This will permanently remove the schedule. Existing runs will not be affected."
        confirmLabel="Delete"
        cancelLabel="Keep Schedule"
        variant="destructive"
        isPending={deleteScheduleMutation.isPending}
        onConfirm={handleDelete}
      />
    </View>
  );
}
