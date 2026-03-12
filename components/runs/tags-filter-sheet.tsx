import { forwardRef, useState, useMemo, useImperativeHandle, useRef } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { BottomSheet, type BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '@/components/ui/bottom-sheet/bottom-sheet-header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TagsFilterSheetProps {
  selected: string[];
  availableTags: string[];
  onApply: (tags: string[]) => void;
}

export const TagsFilterSheet = forwardRef<BottomSheetRef, TagsFilterSheetProps>(
  ({ selected, availableTags, onApply }, ref) => {
    const insets = useSafeAreaInsets();
    const { height } = useWindowDimensions();

    const sheetRef = useRef<BottomSheetRef>(null);
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

    const filteredTags = useMemo(
      () =>
        search
          ? availableTags.filter((t) => t.toLowerCase().includes(search.toLowerCase()))
          : availableTags,
      [availableTags, search]
    );

    const toggleTag = (tag: string) => {
      setLocalSelected((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
      );
    };

    return (
      <BottomSheet ref={sheetRef}
        scrollable
        maxContentHeight={height * 0.6}
        header={<BottomSheetHeader title="Filter by Tags" />}
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
        }>
        <View className="px-4 py-4 border-b border-border">
          <Input
            placeholder="Search tags..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <ScrollView nestedScrollEnabled className="px-4" contentContainerStyle={{ paddingBottom: 80 }}>
          {filteredTags.length === 0 ? (
            <Text className="text-sm text-muted-foreground py-4 text-center">
              No tags found
            </Text>
          ) : (
            filteredTags.map((tag) => (
              <Pressable
                key={tag}
                onPress={() => toggleTag(tag)}
                className="flex-row items-center gap-3 px-1 py-2"
              >
                <Checkbox
                  checked={localSelected.includes(tag)}
                  onCheckedChange={() => toggleTag(tag)}
                />
                <Text className="text-sm text-foreground">{tag}</Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      </BottomSheet>
    );
  }
);

TagsFilterSheet.displayName = 'TagsFilterSheet';
