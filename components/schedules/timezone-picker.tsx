import { forwardRef, useState, useMemo, useImperativeHandle, useRef } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { BottomSheet, type BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '@/components/ui/bottom-sheet/bottom-sheet-header';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown } from 'lucide-react-native';

interface TimezonePickerProps {
  value: string;
  onChange: (tz: string) => void;
  timezones: string[];
}

export const TimezonePicker = forwardRef<BottomSheetRef, TimezonePickerProps>(
  ({ value, onChange, timezones }, ref) => {
    const sheetRef = useRef<BottomSheetRef>(null);
    const [search, setSearch] = useState('');
    const { height } = useWindowDimensions();

    useImperativeHandle(ref, () => ({
      present: async () => {
        setSearch('');
        await sheetRef.current?.present();
      },
      dismiss: async () => { await sheetRef.current?.dismiss(); },
    }));

    const filtered = useMemo(() => {
      if (!search) return timezones;
      const lower = search.toLowerCase();
      return timezones.filter((tz) => tz.toLowerCase().includes(lower));
    }, [timezones, search]);

    const handleSelect = (tz: string) => {
      onChange(tz);
      sheetRef.current?.dismiss();
      setSearch('');
    };

    return (
      <>
        <Button variant="outline" className="justify-between" onPress={() => sheetRef.current?.present()}>
          <Text className="text-sm text-foreground" numberOfLines={1}>{value || 'Select timezone'}</Text>
          <ChevronDown size={16} color="#8B95A5" />
        </Button>
        <BottomSheet
          ref={sheetRef}
          scrollable
          maxContentHeight={height * 0.6}
          header={<BottomSheetHeader title="Select Timezone" />}
        >
          <View className="px-4 pt-2 pb-2">
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder="Search timezones..."
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <ScrollView nestedScrollEnabled className="px-4" contentContainerStyle={{ paddingBottom: 16 }}>
            {filtered.length === 0 ? (
              <View className="py-6 items-center px-4">
                <Text className="text-sm text-muted-foreground">No timezones found</Text>
              </View>
            ) : (
              filtered.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => handleSelect(item)}
                  className="flex-row items-center justify-between px-3 py-2.5 rounded-md active:bg-muted"
                >
                  <Text className="text-sm text-foreground flex-1" numberOfLines={1}>
                    {item}
                  </Text>
                  {item === value && <Check size={16} color="#22c55e" />}
                </Pressable>
              ))
            )}
          </ScrollView>
        </BottomSheet>
      </>
    );
  }
);

TimezonePicker.displayName = 'TimezonePicker';
