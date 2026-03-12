import { forwardRef, useState, useMemo, useImperativeHandle, useRef } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet, type BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '@/components/ui/bottom-sheet/bottom-sheet-header';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown } from 'lucide-react-native';

interface TaskPickerProps {
  value: string;
  onChange: (task: string) => void;
  tasks: string[];
}

export const TaskPicker = forwardRef<BottomSheetRef, TaskPickerProps>(
  ({ value, onChange, tasks }, ref) => {
    const sheetRef = useRef<BottomSheetRef>(null);
    const insets = useSafeAreaInsets();
    const { height } = useWindowDimensions();
    const [localSelected, setLocalSelected] = useState(value);
    const [search, setSearch] = useState('');

    useImperativeHandle(ref, () => ({
      present: async () => {
        setLocalSelected(value);
        setSearch('');
        await sheetRef.current?.present();
      },
      dismiss: async () => { await sheetRef.current?.dismiss(); },
    }));

    const filtered = useMemo(() => {
      if (!search) return tasks;
      const lower = search.toLowerCase();
      return tasks.filter((t) => t.toLowerCase().includes(lower));
    }, [tasks, search]);

    return (
      <>
        <Button variant="outline" className="justify-between" onPress={() => sheetRef.current?.present()}>
          <Text className="text-sm text-foreground" numberOfLines={1}>
            {value || 'Select task'}
          </Text>
          <ChevronDown size={16} color="#8B95A5" />
        </Button>
        <BottomSheet
          ref={sheetRef}
          scrollable
          maxContentHeight={height * 0.6}
          header={<BottomSheetHeader title="Select Task" />}
          footer={
            <View style={{ paddingBottom: insets.bottom / 2 }} className="px-4 pt-3 flex-row gap-2">
              <Button variant="glass" onPress={() => sheetRef.current?.dismiss()} className="flex-1">
                <Text className="text-sm font-medium">Cancel</Text>
              </Button>
              <Button
                glassTintColor='rgb(38, 217, 104)'
                variant="glass"
                onPress={() => {
                  onChange(localSelected);
                  sheetRef.current?.dismiss();
                }}
                className="flex-1"
              >
                <Text className="text-sm font-medium text-primary-foreground">Apply</Text>
              </Button>
            </View>
          }
        >
          <View className="px-4 py-4 border-b border-border">
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder="Search tasks..."
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <ScrollView nestedScrollEnabled className="px-4" contentContainerStyle={{ paddingBottom: 80 }}>
            {filtered.length === 0 ? (
              <Text className="text-sm text-muted-foreground py-4 text-center">
                {tasks.length === 0 ? 'No tasks available' : 'No tasks found'}
              </Text>
            ) : (
              filtered.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setLocalSelected(item)}
                  className="flex-row items-center gap-3 px-1 py-2"
                >
                  <Checkbox
                    checked={localSelected === item}
                    onCheckedChange={() => setLocalSelected(item)}
                  />
                  <Text className="text-sm text-foreground">{item}</Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </BottomSheet>
      </>
    );
  }
);

TaskPicker.displayName = 'TaskPicker';
