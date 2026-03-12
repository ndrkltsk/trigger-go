import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Skeleton } from '@/components/ui/skeleton';
import type { LucideIcon } from 'lucide-react-native';

interface StatCardProps {
  label: string;
  count: number;
  color: string;
  icon: LucideIcon;
  onPress?: () => void;
}

export const StatCard = React.memo(function StatCard({
  label,
  count,
  color,
  icon: Icon,
  onPress,
}: StatCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${count}`}
      accessibilityHint="Double tap to view details"
    >
      <View
        className="bg-card border-border rounded-lg border p-3 min-h-[80px]"
        style={{ borderLeftWidth: 4, borderLeftColor: color }}
      >
        <View className="flex-row items-center gap-1.5 mb-1">
          <Icon size={16} color={color} />
          <Text className="text-mobile-caption text-muted-foreground">{label}</Text>
        </View>
        <Text className="text-[22px] font-bold text-foreground">{count}</Text>
      </View>
    </Pressable>
  );
});

export function StatCardSkeleton() {
  return (
    <View
      className="flex-1 bg-card border-border rounded-lg border p-3 min-h-[80px]"
      style={{ borderLeftWidth: 4, borderLeftColor: '#8B95A5' }}
    >
      <Skeleton className="h-3 w-16 mb-2" />
      <Skeleton className="h-7 w-10" />
    </View>
  );
}
