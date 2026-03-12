import { forwardRef, useRef, useImperativeHandle } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { BottomSheet, type BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '@/components/ui/bottom-sheet/bottom-sheet-header';
import { Text } from '@/components/ui/text';
import { Check } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import type { PeriodPreset } from '@/stores/filters-store';

const PERIOD_OPTIONS: { value: PeriodPreset | null; label: string }[] = [
  { value: '1h', label: 'Last hour' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: null, label: 'All time' },
];

interface PeriodFilterSheetProps {
  selected: PeriodPreset | null;
  onSelect: (period: PeriodPreset | null) => void;
}

export const PeriodFilterSheet = forwardRef<BottomSheetRef, PeriodFilterSheetProps>(
  ({ selected, onSelect }, ref) => {
    const sheetRef = useRef<BottomSheetRef>(null);
    const { height } = useWindowDimensions();

    useImperativeHandle(ref, () => ({
      present: async () => { await sheetRef.current?.present(); },
      dismiss: async () => { await sheetRef.current?.dismiss(); },
    }));

    return (
      <BottomSheet ref={sheetRef} scrollable maxContentHeight={height * 0.6} header={<BottomSheetHeader title="Filter by Period" />}>
        <ScrollView nestedScrollEnabled className="px-4" contentContainerStyle={{ paddingBottom: 16 }}>
          {PERIOD_OPTIONS.map(({ value, label }) => {
            const isSelected = value === selected;
            return (
              <Pressable
                key={label}
                onPress={() => {
                  onSelect(value);
                  sheetRef.current?.dismiss();
                }}
                className={cn(
                  'flex-row items-center justify-between rounded-lg px-3 py-3',
                  isSelected && 'bg-accent'
                )}
              >
                <Text
                  className={cn(
                    'text-sm font-medium',
                    isSelected ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {label}
                </Text>
                {isSelected && <Check size={16} color="#22c55e" />}
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheet>
    );
  }
);

PeriodFilterSheet.displayName = 'PeriodFilterSheet';
