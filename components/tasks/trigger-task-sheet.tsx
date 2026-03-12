import { forwardRef, useState, useCallback, useImperativeHandle, useRef } from 'react';
import { Platform, ScrollView, useWindowDimensions, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet, type BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '@/components/ui/bottom-sheet/bottom-sheet-header';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TaskPicker } from '@/components/schedules/task-picker';
import { TriggerPayloadEditor } from './trigger-payload-editor';
import { TriggerOptions, type TriggerOptionsValues } from './trigger-options';
import { PreviousRunsPicker } from './previous-runs-picker';
import { useTriggerTask, useTasksList } from '@/hooks/api/use-tasks';
import { useToast } from '@/stores/toast-store';
import { History } from 'lucide-react-native';
import type { TriggerTaskRequestBody } from '@/services/api/tasks';
import { generateSampleFromSchema } from '@/lib/json-schema-sample';

const DEFAULT_OPTIONS: TriggerOptionsValues = {
  delay: '',
  ttl: '',
  tags: '',
  queueName: '',
  concurrencyKey: '',
  idempotencyKey: '',
  machine: undefined,
};

export interface TriggerTaskSheetRef {
  present: (initialTaskSlug?: string) => Promise<void>;
  dismiss: () => Promise<void>;
}

export const TriggerTaskSheet = forwardRef<TriggerTaskSheetRef>(
  (_, ref) => {
    const router = useRouter();
    const sheetRef = useRef<BottomSheetRef>(null);
    const pickerRef = useRef<BottomSheetRef>(null);
    const insets = useSafeAreaInsets();
    const isIPad = Platform.OS === 'ios' && Platform.isPad;
    const bottomInset = isIPad ? 0 : insets.bottom;
    const { height } = useWindowDimensions();

    const { showToast } = useToast();
    const triggerMutation = useTriggerTask();
    const { tasks: workerTasks } = useTasksList();
    const availableTasks = workerTasks.map((t) => t.slug).sort();

    const [selectedTask, setSelectedTask] = useState('');
    const [lockedTask, setLockedTask] = useState<string | undefined>(undefined);
    const [payload, setPayload] = useState('');
    const [payloadError, setPayloadError] = useState<string | undefined>(undefined);
    const [options, setOptions] = useState<TriggerOptionsValues>(DEFAULT_OPTIONS);
    const [generalError, setGeneralError] = useState<string | undefined>(undefined);

    const handleTaskChange = useCallback((taskSlug: string) => {
      setSelectedTask(taskSlug);
      setPayloadError(undefined);

      // Prefill payload from the task's payload schema
      const task = workerTasks.find((t) => t.slug === taskSlug);
      if (task?.payloadSchema && typeof task.payloadSchema === 'object') {
        const sample = generateSampleFromSchema(task.payloadSchema);
        if (sample !== undefined) {
          setPayload(JSON.stringify(sample, null, 2));
          return;
        }
      }
      setPayload('');
    }, [workerTasks]);

    useImperativeHandle(ref, () => ({
      present: async (initialTaskSlug?: string) => {
        setPayloadError(undefined);
        setOptions(DEFAULT_OPTIONS);
        setGeneralError(undefined);
        if (initialTaskSlug) {
          setLockedTask(initialTaskSlug);
          handleTaskChange(initialTaskSlug);
        } else {
          setLockedTask(undefined);
          setSelectedTask('');
          setPayload('');
        }
        await sheetRef.current?.present();
      },
      dismiss: async () => {
        await sheetRef.current?.dismiss();
      },
    }));

    const buildOptions = useCallback((): TriggerTaskRequestBody['options'] | undefined => {
      const opts: TriggerTaskRequestBody['options'] = {};
      let hasOptions = false;

      if (options.delay.trim()) { opts.delay = options.delay.trim(); hasOptions = true; }
      if (options.ttl.trim()) { opts.ttl = options.ttl.trim(); hasOptions = true; }
      if (options.tags.trim()) {
        opts.tags = options.tags.split(',').map((t) => t.trim()).filter(Boolean);
        hasOptions = true;
      }
      if (options.queueName.trim()) { opts.queue = { name: options.queueName.trim() }; hasOptions = true; }
      if (options.concurrencyKey.trim()) { opts.concurrencyKey = options.concurrencyKey.trim(); hasOptions = true; }
      if (options.idempotencyKey.trim()) { opts.idempotencyKey = options.idempotencyKey.trim(); hasOptions = true; }
      if (options.machine) {
        opts.machine = options.machine.value as TriggerTaskRequestBody['options'] extends { machine?: infer M } ? M : never;
        hasOptions = true;
      }

      return hasOptions ? opts : undefined;
    }, [options]);

    const handlePayloadReuse = useCallback((reusedPayload: unknown) => {
      const formatted = reusedPayload != null ? JSON.stringify(reusedPayload, null, 2) : '';
      setPayload(formatted);
      setPayloadError(undefined);
    }, []);

    const handleTrigger = useCallback(async () => {
      if (!selectedTask) {
        showToast({ type: 'error', title: 'Please select a task' });
        return;
      }

      let parsedPayload: unknown = undefined;
      if (payload.trim()) {
        try {
          parsedPayload = JSON.parse(payload);
          setPayloadError(undefined);
        } catch (e) {
          const msg = e instanceof SyntaxError ? e.message : 'Invalid JSON';
          setPayloadError(`Invalid JSON: ${msg}`);
          return;
        }
      }

      try {
        const result = await triggerMutation.mutateAsync({
          taskIdentifier: selectedTask,
          params: {
            payload: parsedPayload,
            options: buildOptions(),
          },
        });

        sheetRef.current?.dismiss();

        showToast({
          type: 'success',
          title: 'Task triggered successfully',
          action: result.id
            ? { label: 'View', onPress: () => router.push(`/(dashboard)/(runs)/${result.id}`) }
            : undefined,
        });

        if (result.id) {
          router.push(`/(dashboard)/(runs)/${result.id}`);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to trigger task';
        setGeneralError(message);
      }
    }, [selectedTask, payload, buildOptions, triggerMutation, showToast, router]);

    return (
      <BottomSheet
        ref={sheetRef}
        scrollable
        maxContentHeight={height * 0.85}
        header={<BottomSheetHeader title={lockedTask ? `Trigger ${lockedTask}` : 'Trigger Task'} />}
        footer={
          <View style={{ paddingBottom: insets.bottom / 2 }} className="px-4 pt-3 flex-row gap-2">
            <Button variant="glass" onPress={() => sheetRef.current?.dismiss()} className="flex-1">
              <Text className="text-sm font-medium">Cancel</Text>
            </Button>
            <Button
              glassTintColor="rgb(59, 130, 246)"
              variant="glass"
              onPress={handleTrigger}
              disabled={triggerMutation.isPending || !selectedTask}
              className="flex-1"
            >
              {triggerMutation.isPending ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#fff" />
                  <Text className="text-sm font-medium text-primary-foreground">Triggering...</Text>
                </View>
              ) : (
                <Text className="text-sm font-medium text-primary-foreground">Trigger</Text>
              )}
            </Button>
          </View>
        }
      >
        <ScrollView nestedScrollEnabled className="px-4" contentContainerStyle={{ paddingBottom: bottomInset + 32, gap: 20, paddingTop: 16 }} keyboardShouldPersistTaps="handled">
          {!lockedTask && (
            <View className="gap-1.5">
              <Text className="text-sm font-medium text-foreground">Task</Text>
              <TaskPicker
                value={selectedTask}
                onChange={handleTaskChange}
                tasks={availableTasks}
              />
            </View>
          )}

          <TriggerPayloadEditor
            value={payload}
            onChange={setPayload}
            error={payloadError}
          />

          <Button
            variant="outline"
            onPress={() => pickerRef.current?.present()}
            disabled={!selectedTask}
            className="flex-row items-center gap-2"
          >
            <History size={16} color="#8B95A5" />
            <Text className="text-sm">Use Previous Payload</Text>
          </Button>

          {selectedTask ? (
            <PreviousRunsPicker
              ref={pickerRef}
              taskIdentifier={selectedTask}
              onSelect={handlePayloadReuse}
            />
          ) : null}

          <TriggerOptions values={options} onChange={setOptions} />

          {generalError && (
            <Text className="text-sm text-destructive text-center">{generalError}</Text>
          )}
        </ScrollView>
      </BottomSheet>
    );
  }
);

TriggerTaskSheet.displayName = 'TriggerTaskSheet';
