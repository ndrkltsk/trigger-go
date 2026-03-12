import { forwardRef, useState, useImperativeHandle, useRef } from 'react';
import { Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet, type BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Text } from '@/components/ui/text';
import { RUN_STATUS_CONFIG, getStatusConfig } from '@/lib/status-colors';
import { BottomSheetHeader } from '../ui/bottom-sheet/bottom-sheet-header';

const ALL_STATUSES = Object.keys(RUN_STATUS_CONFIG);
const isIPad = Platform.OS === 'ios' && Platform.isPad;

interface StatusFilterSheetProps {
  selected: string[];
  onApply: (statuses: string[]) => void;
}

export const StatusFilterSheet = forwardRef<BottomSheetRef, StatusFilterSheetProps>(
  ({ selected, onApply }, ref) => {
    const sheetRef = useRef<BottomSheetRef>(null);
    const [localSelected, setLocalSelected] = useState<string[]>(selected);
    const insets = useSafeAreaInsets();
    const bottomInset = isIPad ? 0 : insets.bottom;
    const { height } = useWindowDimensions();

    useImperativeHandle(ref, () => ({
      present: async () => {
        setLocalSelected(selected);
        await sheetRef.current?.present();
      },
      dismiss: async () => { await sheetRef.current?.dismiss(); },
    }));

    const toggleStatus = (status: string) => {
      setLocalSelected((prev) =>
        prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
      );
    };

    const toggleAll = () => {
      setLocalSelected((prev) =>
        prev.length === ALL_STATUSES.length ? [] : [...ALL_STATUSES]
      );
    };

    return (
      <BottomSheet
        ref={sheetRef}
        scrollable
        maxContentHeight={height * 0.6}
        header={<BottomSheetHeader title="Filter by Status" />}
        footer={
          <View style={{ paddingBottom: insets.bottom / 2 }} className="px-4 pt-3 flex-row gap-2">
            <Button variant="glass" onPress={() => sheetRef.current?.dismiss()} className="flex-1">
              <Text className="text-sm font-medium">Cancel</Text>
            </Button>
            <Button
              glassTintColor='rgb(38, 217, 104)'
              variant="glass"
              onPress={() => {
                onApply(localSelected);
                sheetRef.current?.dismiss();
              }}
              className="flex-1"
            >
              <Text className="text-sm font-medium text-primary-foreground">Apply</Text>
            </Button>
          </View>
        }
      >
        <ScrollView nestedScrollEnabled className="px-4" contentContainerStyle={{ paddingBottom: bottomInset + 16 }}>
          <Pressable onPress={toggleAll} className="flex-row items-center gap-3 px-1 py-2">
            <Checkbox
              checked={localSelected.length === ALL_STATUSES.length}
              onCheckedChange={toggleAll}
            />
            <Text className="text-base text-foreground">
              {localSelected.length === ALL_STATUSES.length ? 'Deselect all' : 'Select all'}
            </Text>
          </Pressable>

          {ALL_STATUSES.map((status) => {
            const config = getStatusConfig(status);
            return (
              <Pressable
                key={status}
                onPress={() => toggleStatus(status)}
                className="flex-row items-center gap-3 px-1 py-2"
              >
                <Checkbox
                  checked={localSelected.includes(status)}
                  onCheckedChange={() => toggleStatus(status)}
                />
                <Text className="text-base text-foreground" style={config.color !== '#8B95A5' ? { color: config.color } : undefined}>{config.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheet>
    );
  }
);

StatusFilterSheet.displayName = 'StatusFilterSheet';
