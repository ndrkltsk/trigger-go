import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { Skeleton } from '@/components/ui/skeleton';
import { RunDetailHeader } from '@/components/runs/run-detail-header';
import { RunErrorDisplay } from '@/components/runs/run-error-display';
import { RunProgressBar } from '@/components/runs/run-progress-bar';
import { RunTags } from '@/components/runs/run-tags';
import { RelatedRuns } from '@/components/runs/related-runs';
import { ActionBar } from '@/components/runs/action-bar';
import { CancelConfirmSheet } from '@/components/runs/cancel-confirm-dialog';
import type { ConfirmSheetRef } from '@/components/shared/confirm-sheet';
import { JsonViewer } from '@/components/shared/json-viewer';
import { MetadataEditor } from '@/components/runs/metadata-editor';
import { RunLifecycleTimeline } from '@/components/runs/run-lifecycle-timeline';
import { RunAttemptsTab } from '@/components/runs/run-attempts-tab';
import { useRun, useRunTrace, useCancelRun, useReplayRun, useUpdateRunMetadata } from '@/hooks/api/use-runs';
import { useRealtimeRun } from '@/hooks/use-realtime-run';
import { useFiltersStore } from '@/stores/filters-store';
import { useToast } from '@/stores/toast-store';
import { isTerminalStatus } from '@/lib/status-colors';
import { Pencil } from 'lucide-react-native';
import type { BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';
import { posthogCapture } from '@/services/posthog';

export default function RunDetailScreen() {
  const { runId } = useLocalSearchParams<{ runId: string }>();
  const router = useRouter();
  const { data: run, isLoading, isError, error, refetch } = useRun(runId);
  const { data: traceData } = useRunTrace(runId, run?.status);
  const cancelRun = useCancelRun();
  const replayRunMutation = useReplayRun();
  const updateMetadata = useUpdateRunMetadata();
  const { showToast } = useToast();
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const cancelSheetRef = useRef<ConfirmSheetRef>(null);
  const metadataEditorRef = useRef<BottomSheetRef>(null);

  const isActive = !!run && !isTerminalStatus(run.status);
  useRealtimeRun(runId, isActive);

  useEffect(() => {
    if (run) {
      posthogCapture('run viewed', { run_id: runId, status: run.status, task_identifier: run.taskIdentifier });
    }
  }, [runId, run?.status, run?.taskIdentifier]);

  // Extract the error from the latest failed attempt
  const runError = useMemo(() => {
    if (!run?.attempts) return null;
    const failedAttempt = [...run.attempts]
      .reverse()
      .find((a) => a.error);
    return failedAttempt?.error ?? null;
  }, [run?.attempts]);

  const handleCopyRunId = () => {
    Clipboard.setStringAsync(runId);
    showToast({ type: 'success', title: 'Run ID copied' });
  };

  const handleCancel = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await cancelRun.mutateAsync(runId);
      cancelSheetRef.current?.dismiss();
    } catch {
      // Error is available via cancelRun.error
    }
  };

  const handleReplay = async () => {
    if (!run) return;

    try {
      const result = await replayRunMutation.mutateAsync({
        taskIdentifier: run.taskIdentifier,
        payload: run.payload,
      });
      const newRunId = result.id;
      showToast({ type: 'success', title: 'Run replayed successfully' });
      if (newRunId) {
        router.replace(`/(dashboard)/(runs)/${newRunId}`);
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Failed to replay run',
        message: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const handleSaveMetadata = async (metadata: Record<string, unknown>) => {
    try {
      await updateMetadata.mutateAsync({ runId, metadata });
      metadataEditorRef.current?.dismiss();
      showToast({ type: 'success', title: 'Metadata updated' });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Failed to update metadata',
        message: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const handleTagPress = (tag: string) => {
    useFiltersStore.getState().setTagFilter([tag]);
    router.back();
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View className="px-4 py-4 gap-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-52" />
          <View className="mt-4 gap-2">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </View>
        </View>
      </View>
    );
  }

  if (isError || !run) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Stack.Screen options={{ title: 'Error' }} />
        <Text className="text-destructive text-center mb-4">
          {error?.message ?? 'Run not found'}
        </Text>
        <Button variant="outline" onPress={() => refetch()}>
          <Text className="text-sm font-medium">Try again</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: run.taskIdentifier }} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="ellipsis">
          <Stack.Toolbar.MenuAction icon="doc.on.doc" onPress={handleCopyRunId}>
            Copy Run ID
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      <View className="px-4 pt-2 pb-1">
        <SegmentedControl
          values={['Overview', 'Timeline', 'Attempts']}
          selectedIndex={selectedTabIndex}
          onChange={({ nativeEvent }) => setSelectedTabIndex(nativeEvent.selectedSegmentIndex)}
        />
      </View>

      {selectedTabIndex === 0 && (
        <ScrollView className="flex-1" contentInsetAdjustmentBehavior="automatic">
          <RunDetailHeader run={run} />

          {isActive && run.metadata && (
            <RunProgressBar metadata={run.metadata as Record<string, unknown>} />
          )}

          {runError && (
            <View className="px-4 pb-3">
              <RunErrorDisplay error={runError} />
            </View>
          )}

          {run.payload !== undefined && (
            <View className="px-4 pb-3">
              <JsonViewer data={run.payload} title="Payload" />
            </View>
          )}

          {run.output !== undefined && (
            <View className="px-4 pb-3">
              <JsonViewer data={run.output} title="Output" />
            </View>
          )}

          {run.tags && run.tags.length > 0 && (
            <RunTags tags={run.tags} onTagPress={handleTagPress} />
          )}

          {run.metadata && (
            <View className="px-4 pb-3">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm font-semibold text-foreground">Metadata</Text>
                <Pressable
                  onPress={() => metadataEditorRef.current?.present()}
                  className="flex-row items-center gap-1 px-2 py-1 rounded active:opacity-70"
                >
                  <Pencil size={14} color="#8B95A5" />
                  <Text className="text-xs text-muted-foreground">Edit</Text>
                </Pressable>
              </View>
              <JsonViewer data={run.metadata} defaultCollapsed />
            </View>
          )}

          <RelatedRuns relatedRuns={run.relatedRuns} />

          {run.schedule && (
            <View className="px-4 py-3">
              <Text className="text-sm font-semibold text-foreground mb-2">Schedule</Text>
              <View className="rounded-lg bg-muted/30 px-4 py-3">
                {run.schedule.generator?.expression && (
                  <View className="flex-row items-baseline justify-between py-1">
                    <Text className="text-xs text-muted-foreground">Cron</Text>
                    <Text className="text-xs text-foreground">
                      {run.schedule.generator.expression}
                    </Text>
                  </View>
                )}
                {run.schedule.generator?.description && (
                  <View className="flex-row items-baseline justify-between py-1">
                    <Text className="text-xs text-muted-foreground">Description</Text>
                    <Text className="text-xs text-foreground">
                      {run.schedule.generator.description}
                    </Text>
                  </View>
                )}
                {run.schedule.externalId && (
                  <View className="flex-row items-baseline justify-between py-1">
                    <Text className="text-xs text-muted-foreground">External ID</Text>
                    <Text className="text-xs text-foreground">
                      {run.schedule.externalId}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {selectedTabIndex === 1 && (
        <ScrollView className="flex-1" contentInsetAdjustmentBehavior="automatic">
          <RunLifecycleTimeline run={run} traceData={traceData ?? null} />
        </ScrollView>
      )}

      {selectedTabIndex === 2 && (
        <ScrollView className="flex-1" contentInsetAdjustmentBehavior="automatic">
          <RunAttemptsTab run={run} error={runError} traceData={traceData ?? null} />
        </ScrollView>
      )}

      <ActionBar
        status={run.status}
        onCancel={() => cancelSheetRef.current?.present()}
        onReplay={handleReplay}
        isCanceling={cancelRun.isPending}
        isReplaying={replayRunMutation.isPending}
      />

      <CancelConfirmSheet
        ref={cancelSheetRef}
        onConfirm={handleCancel}
        isPending={cancelRun.isPending}
      />

      {run.metadata && (
        <MetadataEditor
          ref={metadataEditorRef}
          currentMetadata={run.metadata as Record<string, unknown>}
          onSave={handleSaveMetadata}
          isPending={updateMetadata.isPending}
        />
      )}
    </View>
  );
}
