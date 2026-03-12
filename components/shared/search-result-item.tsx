import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Play, Layers, CalendarClock } from 'lucide-react-native';

const TYPE_CONFIG = {
  run: { icon: Play, label: 'Run' },
  task: { icon: Layers, label: 'Task' },
  schedule: { icon: CalendarClock, label: 'Schedule' },
} as const;

interface SearchResultItemProps {
  type: 'run' | 'task' | 'schedule';
  title: string;
  subtitle?: string;
  statusBadge?: React.ReactNode;
  onPress: () => void;
}

export function SearchResultItem({
  type,
  title,
  subtitle,
  statusBadge,
  onPress,
}: SearchResultItemProps) {
  const config = TYPE_CONFIG[type];

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-2.5 active:bg-muted/50"
    >
      <View className="mr-3">
        <Icon as={config.icon} size={20} className="text-muted-foreground" />
      </View>
      <View className="flex-1 min-w-0">
        <Text
          className="text-mobile-secondary text-foreground"
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="text-mobile-caption text-muted-foreground" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {statusBadge && <View className="ml-2">{statusBadge}</View>}
    </Pressable>
  );
}
