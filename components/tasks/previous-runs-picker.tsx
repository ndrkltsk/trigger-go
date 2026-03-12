import { forwardRef, useState, useCallback, useRef, useImperativeHandle } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View, ActivityIndicator } from 'react-native';
import { BottomSheet, type BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '@/components/ui/bottom-sheet/bottom-sheet-header';
import { Text } from '@/components/ui/text';
import { RunStatusBadge } from '@/components/runs/run-status-badge';
import { formatRelativeTime } from '@/lib/format';
import { listProjectRuns, retrieveRun, type ListRunItem } from '@/services/api/runs';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { usePreferencesStore } from '@/stores/preferences-store';

interface PreviousRunsPickerProps {
  taskIdentifier: string;
  onSelect: (payload: unknown) => void;
}

export const PreviousRunsPicker = forwardRef<BottomSheetRef, PreviousRunsPickerProps>(
  ({ taskIdentifier, onSelect }, ref) => {
    const sheetRef = useRef<BottomSheetRef>(null);
    const [fetchingRunId, setFetchingRunId] = useState<string | null>(null);
    const { height } = useWindowDimensions();

    useImperativeHandle(ref, () => ({
      present: async () => {
        await sheetRef.current?.present();
      },
      dismiss: async () => { await sheetRef.current?.dismiss(); },
    }));

    const projectRef = useAuthStore((s) => s.projectRef);
    const selectedEnvironment = usePreferencesStore((s) => s.selectedEnvironment);

    const queryEnabled = !!taskIdentifier && !!projectRef;

    const {
      data: runsData,
      isLoading,
      isError,
      error,
    } = useQuery({
      queryKey: ['previous-runs', taskIdentifier, projectRef, selectedEnvironment],
      queryFn: async () => {
        const result = await listProjectRuns(projectRef!, {
          taskIdentifier: [taskIdentifier],
          pageSize: 10,
          env: [selectedEnvironment],
          createdAtFrom: new Date(0).toISOString(),
          createdAtTo: new Date().toISOString(),
        });
        return result;
      },
      enabled: queryEnabled,
      staleTime: 10_000,
    });

    const runs = runsData?.data ?? [];

    const handleSelect = useCallback(
      async (run: ListRunItem) => {
        setFetchingRunId(run.id);
        try {
          const detail = await retrieveRun(run.id);
          onSelect(detail.payload);
          sheetRef.current?.dismiss();
        } catch {
          // Silently fail - user can try again
        } finally {
          setFetchingRunId(null);
        }
      },
      [onSelect]
    );

    return (
      <BottomSheet
        ref={sheetRef}
        scrollable
        maxContentHeight={height * 0.6}
        header={<BottomSheetHeader title="Select a Previous Run" />}
      >
        <ScrollView nestedScrollEnabled className="px-4" contentContainerStyle={{ paddingBottom: 16 }}>
          {isLoading && (
            <View className="py-8 items-center">
              <ActivityIndicator size="small" />
              <Text className="text-sm text-muted-foreground mt-2">Loading runs...</Text>
            </View>
          )}

          {isError && (
            <View className="py-8 items-center">
              <Text className="text-sm text-destructive">Failed to load runs</Text>
            </View>
          )}

          {!isLoading && !isError && runs.length === 0 && (
            <View className="py-8 items-center">
              <Text className="text-sm text-muted-foreground">
                No recent runs for this task
              </Text>
            </View>
          )}

          {!isLoading && !isError && runs.map((item) => {
            const isFetching = fetchingRunId === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => handleSelect(item)}
                disabled={fetchingRunId !== null}
                className="flex-row items-center justify-between px-3 py-2.5 rounded-md active:bg-muted"
              >
                <View className="flex-1 gap-0.5">
                  <Text className="text-xs font-mono text-foreground">{item.id}</Text>
                  <Text className="text-xs text-muted-foreground">
                    {formatRelativeTime(item.createdAt)}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <RunStatusBadge status={item.status} />
                  {isFetching && <ActivityIndicator size="small" />}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheet>
    );
  }
);

PreviousRunsPicker.displayName = 'PreviousRunsPicker';
