import { forwardRef, useState, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet, type BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '@/components/ui/bottom-sheet/bottom-sheet-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { formatDateTime } from '@/lib/format';

const DELAY_PRESETS = [
  { label: '15 minutes', value: '15m' },
  { label: '1 hour', value: '1h' },
  { label: '6 hours', value: '6h' },
  { label: '1 day', value: '1d' },
] as const;

interface RescheduleSheetProps {
  currentDelayedUntil: string;
  onConfirm: (delay: string) => void;
  isPending: boolean;
}

export const RescheduleSheet = forwardRef<BottomSheetRef, RescheduleSheetProps>(
  ({ currentDelayedUntil, onConfirm, isPending }, ref) => {
    const sheetRef = useRef<BottomSheetRef>(null);
    const insets = useSafeAreaInsets();
    const [selectedDelay, setSelectedDelay] = useState('');
    const [customDelay, setCustomDelay] = useState('');

    const activeDelay = customDelay || selectedDelay;

    useImperativeHandle(ref, () => ({
      present: async () => {
        setSelectedDelay('');
        setCustomDelay('');
        await sheetRef.current?.present();
      },
      dismiss: async () => { await sheetRef.current?.dismiss(); },
    }));

    const handlePresetPress = (value: string) => {
      setSelectedDelay(value);
      setCustomDelay('');
    };

    const handleCustomChange = (text: string) => {
      setCustomDelay(text);
      setSelectedDelay('');
    };

    const handleConfirm = () => {
      if (activeDelay) {
        onConfirm(activeDelay);
      }
    };

    return (
      <BottomSheet
        ref={sheetRef}
        header={<BottomSheetHeader title="Reschedule Run" />}
        footer={
          <View style={{ paddingBottom: insets.bottom / 2 }} className="px-4 pt-3 flex-row gap-2">
            <Button
              variant="glass"
              onPress={() => sheetRef.current?.dismiss()}
              disabled={isPending}
              className="flex-1"
            >
              <Text className="text-sm font-medium">Cancel</Text>
            </Button>
            <Button
              glassTintColor='rgb(38, 217, 104)'
              variant="glass"
              onPress={handleConfirm}
              disabled={!activeDelay || isPending}
              className="flex-1"
            >
              <Text className="text-sm font-medium text-primary-foreground">{isPending ? 'Rescheduling...' : 'Reschedule'}</Text>
            </Button>
          </View>
        }
      >
        <View className="px-4 pb-6 gap-4">
          <Text className="text-sm text-muted-foreground">
            Currently delayed until {formatDateTime(currentDelayedUntil)}
          </Text>

          <View className="gap-3">
            <Text variant="small" className="font-semibold text-foreground">
              Quick presets
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {DELAY_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant={selectedDelay === preset.value && !customDelay ? 'default' : 'outline'}
                  size="sm"
                  onPress={() => handlePresetPress(preset.value)}
                >
                  <Text>{preset.label}</Text>
                </Button>
              ))}
            </View>

            <Text variant="small" className="font-semibold text-foreground mt-2">
              Custom delay
            </Text>
            <Input
              placeholder="e.g. 2h30m, 45m, 1d"
              value={customDelay}
              onChangeText={handleCustomChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text variant="muted" className="text-xs">
              Use format like 15m, 1h, 6h, 1d, or 2h30m
            </Text>
          </View>
        </View>
      </BottomSheet>
    );
  }
);

RescheduleSheet.displayName = 'RescheduleSheet';
