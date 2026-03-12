import { forwardRef, useState, useCallback, useImperativeHandle, useRef } from 'react';
import { Platform, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet, type BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '@/components/ui/bottom-sheet/bottom-sheet-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { CronBuilder } from './cron-builder';
import { TaskPicker } from './task-picker';
import { TimezonePicker } from './timezone-picker';

interface FieldErrors {
  task?: string;
  cron?: string;
  timezone?: string;
  general?: string;
}

export interface ScheduleFormValues {
  task: string;
  cron: string;
  timezone: string;
  deduplicationKey: string;
  externalId: string;
}

export interface ScheduleFormSheetRef {
  presentCreate: () => Promise<void>;
  presentEdit: (values: ScheduleFormValues) => Promise<void>;
  dismiss: () => Promise<void>;
}

interface ScheduleFormSheetProps {
  availableTasks: string[];
  timezones: string[];
  onSubmit: (mode: 'create' | 'edit', values: ScheduleFormValues) => Promise<void>;
  isPending: boolean;
}

export const ScheduleFormSheet = forwardRef<ScheduleFormSheetRef, ScheduleFormSheetProps>(
  ({ availableTasks, timezones, onSubmit, isPending }, ref) => {
    const sheetRef = useRef<BottomSheetRef>(null);
    const insets = useSafeAreaInsets();
    const isIPad = Platform.OS === 'ios' && Platform.isPad;
    const bottomInset = isIPad ? 0 : insets.bottom;
    const { height } = useWindowDimensions();

    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [task, setTask] = useState('');
    const [cron, setCron] = useState('');
    const [timezone, setTimezone] = useState(
      Intl.DateTimeFormat().resolvedOptions().timeZone
    );
    const [deduplicationKey, setDeduplicationKey] = useState('');
    const [externalId, setExternalId] = useState('');
    const [errors, setErrors] = useState<FieldErrors>({});

    useImperativeHandle(ref, () => ({
      presentCreate: async () => {
        setMode('create');
        setTask('');
        setCron('');
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
        setDeduplicationKey('');
        setExternalId('');
        setErrors({});
        await sheetRef.current?.present();
      },
      presentEdit: async (values: ScheduleFormValues) => {
        setMode('edit');
        setTask(values.task);
        setCron(values.cron);
        setTimezone(values.timezone);
        setDeduplicationKey(values.deduplicationKey);
        setExternalId(values.externalId);
        setErrors({});
        await sheetRef.current?.present();
      },
      dismiss: async () => {
        await sheetRef.current?.dismiss();
      },
    }));

    const handleSubmit = useCallback(async () => {
      const newErrors: FieldErrors = {};
      if (!task) newErrors.task = 'Task is required';
      if (!cron) newErrors.cron = 'Cron expression is required';
      if (!timezone) newErrors.timezone = 'Timezone is required';
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;

      try {
        await onSubmit(mode, { task, cron, timezone, deduplicationKey, externalId });
        sheetRef.current?.dismiss();
      } catch (err: unknown) {
        const apiError = err as { body?: { error?: string; details?: Record<string, string> } };
        if (apiError?.body?.details) {
          setErrors(apiError.body.details as FieldErrors);
        } else {
          setErrors({
            general: apiError?.body?.error ?? `Failed to ${mode === 'create' ? 'create' : 'update'} schedule`,
          });
        }
      }
    }, [mode, task, cron, timezone, deduplicationKey, externalId, onSubmit]);

    const isCreate = mode === 'create';

    return (
      <BottomSheet
        ref={sheetRef}
        scrollable
        maxContentHeight={height * 0.8}
        header={<BottomSheetHeader title={isCreate ? 'Create Schedule' : 'Edit Schedule'} />}
        footer={
          <View style={{ paddingBottom: insets.bottom / 2 }} className="px-4 pt-3 flex-row gap-2">
            <Button variant="glass" onPress={() => sheetRef.current?.dismiss()} className="flex-1">
              <Text className="text-sm font-medium">Cancel</Text>
            </Button>
            <Button
              glassTintColor="rgb(38, 217, 104)"
              variant="glass"
              onPress={handleSubmit}
              disabled={isPending}
              className="flex-1"
            >
              <Text className="text-sm font-medium text-primary-foreground">
                {isPending
                  ? isCreate ? 'Creating...' : 'Saving...'
                  : isCreate ? 'Create' : 'Save'}
              </Text>
            </Button>
          </View>
        }
      >
        <ScrollView nestedScrollEnabled className="px-4" contentContainerStyle={{ paddingBottom: bottomInset + 16, gap: 20, paddingTop: 16 }}>
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">Task</Text>
            <TaskPicker
              value={task}
              onChange={(t) => {
                setTask(t);
                setErrors((e) => ({ ...e, task: undefined }));
              }}
              tasks={availableTasks}
            />
            {errors.task && <Text className="text-xs text-destructive">{errors.task}</Text>}
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">Schedule</Text>
            <CronBuilder
              value={cron}
              onChange={(c) => {
                setCron(c);
                setErrors((e) => ({ ...e, cron: undefined }));
              }}
              error={errors.cron}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">Timezone</Text>
            <TimezonePicker value={timezone} onChange={setTimezone} timezones={timezones} />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">
              Deduplication Key (optional)
            </Text>
            <Input
              value={deduplicationKey}
              onChangeText={setDeduplicationKey}
              placeholder="e.g. my-unique-key"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">External ID (optional)</Text>
            <Input
              value={externalId}
              onChangeText={setExternalId}
              placeholder="e.g. ext-123"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {errors.general && (
            <Text className="text-sm text-destructive text-center">{errors.general}</Text>
          )}
        </ScrollView>
      </BottomSheet>
    );
  }
);

ScheduleFormSheet.displayName = 'ScheduleFormSheet';
