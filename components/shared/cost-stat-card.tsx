import React from 'react';
import { View } from 'react-native';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { formatCost } from '@/lib/format';

interface CostStatCardProps {
  label: string;
  costCents: number;
  runCount?: number;
  icon?: React.ReactNode;
}

export function CostStatCard({ label, costCents, runCount, icon }: CostStatCardProps) {
  return (
    <Card className="flex-1 py-4">
      <CardContent className="gap-1">
        {icon && <View className="mb-1">{icon}</View>}
        <Text className="text-[22px] font-bold text-foreground">
          {formatCost(costCents)}
        </Text>
        <Text className="text-mobile-secondary text-muted-foreground">{label}</Text>
        {runCount != null && (
          <Text className="text-mobile-caption text-muted-foreground">
            {runCount} {runCount === 1 ? 'run' : 'runs'}
          </Text>
        )}
      </CardContent>
    </Card>
  );
}
