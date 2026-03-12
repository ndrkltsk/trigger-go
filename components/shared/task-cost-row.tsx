import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { formatCost } from '@/lib/format';

interface TaskCostRowProps {
  taskIdentifier: string;
  totalCostCents: number;
  runCount: number;
  rank: number;
}

export function TaskCostRow({ taskIdentifier, totalCostCents, runCount, rank }: TaskCostRowProps) {
  return (
    <View
      className="flex-row items-center px-4 py-3"
    >
      <Text className="text-mobile-secondary font-semibold text-muted-foreground w-8">
        {rank}
      </Text>
      <View className="flex-1 mr-3">
        <Text className="text-mobile-secondary text-foreground" numberOfLines={1}>
          {taskIdentifier}
        </Text>
        <Text className="text-mobile-caption text-muted-foreground">
          {runCount} {runCount === 1 ? 'run' : 'runs'}
        </Text>
      </View>
      <Text className="text-mobile-secondary font-semibold text-foreground">
        {formatCost(totalCostCents)}
      </Text>
    </View>
  );
}
