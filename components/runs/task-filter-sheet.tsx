import { forwardRef, useState, useMemo, useImperativeHandle, useRef } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet, type BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '@/components/ui/bottom-sheet/bottom-sheet-header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

interface TaskFilterSheetProps {
  selected: string[];
  availableTasks: string[];
  onApply: (tasks: string[]) => void;
}

export const TaskFilterSheet = forwardRef<BottomSheetRef, TaskFilterSheetProps>(
  ({ selected, availableTasks, onApply }, ref) => {
    const sheetRef = useRef<BottomSheetRef>(null);
    const insets = useSafeAreaInsets();
    const { height } = useWindowDimensions();
    const [localSelected, setLocalSelected] = useState<string[]>(selected);
    const [search, setSearch] = useState('');

    useImperativeHandle(ref, () => ({
      present: async () => {
        setLocalSelected(selected);
        setSearch('');
        await sheetRef.current?.present();
      },
      dismiss: async () => { await sheetRef.current?.dismiss(); },
    }));

    const filteredTasks = useMemo(
      () =>
        search
          ? availableTasks.filter((t) => t.toLowerCase().includes(search.toLowerCase()))
          : availableTasks,
      [availableTasks, search]
    );

    const toggleTask = (task: string) => {
      setLocalSelected((prev) =>
        prev.includes(task) ? prev.filter((t) => t !== task) : [...prev, task]
      );
    };

    return (
      <BottomSheet
        ref={sheetRef}
        scrollable
        maxContentHeight={height * 0.6}
        header={<BottomSheetHeader title="Filter by Task" />}
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
        <View className="px-4 py-4 border-b border-border">
          <Input
            placeholder="Search tasks..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <ScrollView nestedScrollEnabled className="px-4" contentContainerStyle={{ paddingBottom: 80 }}>
          {filteredTasks.length === 0 ? (
            <Text className="text-sm text-muted-foreground py-4 text-center">
              No tasks found
            </Text>
          ) : (
            filteredTasks.map((task) => (
              <Pressable
                key={task}
                onPress={() => toggleTask(task)}
                className="flex-row items-center gap-3 px-1 py-2"
              >
                <Checkbox
                  checked={localSelected.includes(task)}
                  onCheckedChange={() => toggleTask(task)}
                />
                <Text className="text-sm text-foreground">{task}</Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      </BottomSheet>
    );
  }
);

TaskFilterSheet.displayName = 'TaskFilterSheet';
