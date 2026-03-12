import { useMemo, useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { FilterChip } from './filter-chip';
import { StatusFilterSheet } from './status-filter-sheet';
import { TaskFilterSheet } from './task-filter-sheet';
import { PeriodFilterSheet } from './period-filter-sheet';
import { TagsFilterSheet } from './tags-filter-sheet';
import { useFiltersStore, hasActiveFilters as checkHasActive } from '@/stores/filters-store';
import { getStatusConfig } from '@/lib/status-colors';
import { X } from 'lucide-react-native';
import type { BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';

const PERIOD_LABELS: Record<string, string> = {
  '1h': 'Last hour',
  '24h': 'Last 24h',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
};

interface RunFiltersProps {
  availableTasks?: string[];
  availableTags?: string[];
}

export function RunFilters({ availableTasks = [], availableTags = [] }: RunFiltersProps) {
  const {
    statusFilter,
    taskFilter,
    tagFilter,
    periodFilter,
    setStatusFilter,
    setTaskFilter,
    setTagFilter,
    setPeriodFilter,
    clearAllFilters,
  } = useFiltersStore();

  const statusSheetRef = useRef<BottomSheetRef>(null);
  const taskSheetRef = useRef<BottomSheetRef>(null);
  const periodSheetRef = useRef<BottomSheetRef>(null);
  const tagsSheetRef = useRef<BottomSheetRef>(null);

  const hasFilters = checkHasActive();

  const statusActiveLabel = useMemo(() => {
    if (statusFilter.length === 0) return undefined;
    const labels = statusFilter.map((s) => getStatusConfig(s).label);
    return labels.length <= 2 ? labels.join(', ') : `${labels.length} statuses`;
  }, [statusFilter]);

  const taskActiveLabel = useMemo(() => {
    if (taskFilter.length === 0) return undefined;
    return taskFilter.length <= 2 ? taskFilter.join(', ') : `${taskFilter.length} tasks`;
  }, [taskFilter]);

  const tagActiveLabel = useMemo(() => {
    if (tagFilter.length === 0) return undefined;
    return tagFilter.length <= 2 ? tagFilter.join(', ') : `${tagFilter.length} tags`;
  }, [tagFilter]);

  const periodActiveLabel = periodFilter ? PERIOD_LABELS[periodFilter] : undefined;

  return (
    <>
      <View className="border-b border-border">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 6 }}
        >
          {hasFilters && (
            <Pressable
              onPress={clearAllFilters}
              className="flex-row items-center gap-1 px-2 py-1.5"
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              accessibilityRole="button"
              accessibilityLabel="Clear all filters"
            >
              <X size={12} color="#ef4444" />
              <Text className="text-xs font-medium text-destructive">Clear all</Text>
            </Pressable>
          )}
          <FilterChip
            label="Status"
            isActive={statusFilter.length > 0}
            activeLabel={statusActiveLabel}
            onPress={() => statusSheetRef.current?.present()}
          />
          <FilterChip
            label="Task"
            isActive={taskFilter.length > 0}
            activeLabel={taskActiveLabel}
            onPress={() => taskSheetRef.current?.present()}
          />
          <FilterChip
            label="Tags"
            isActive={tagFilter.length > 0}
            activeLabel={tagActiveLabel}
            onPress={() => tagsSheetRef.current?.present()}
          />
          <FilterChip
            label="Period"
            isActive={periodFilter !== null}
            activeLabel={periodActiveLabel}
            onPress={() => periodSheetRef.current?.present()}
          />
        </ScrollView>
      </View>

      <StatusFilterSheet
        ref={statusSheetRef}
        selected={statusFilter}
        onApply={setStatusFilter}
      />
      <TaskFilterSheet
        ref={taskSheetRef}
        selected={taskFilter}
        availableTasks={availableTasks}
        onApply={setTaskFilter}
      />
      <TagsFilterSheet
        ref={tagsSheetRef}
        selected={tagFilter}
        availableTags={availableTags}
        onApply={setTagFilter}
      />
      <PeriodFilterSheet
        ref={periodSheetRef}
        selected={periodFilter}
        onSelect={setPeriodFilter}
      />
    </>
  );
}
