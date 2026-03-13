import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { FileCode, Braces } from 'lucide-react-native';
import { formatRelativeTime } from '@/lib/format';
import type { TaskListItem } from '@/hooks/api/use-tasks';

export const TaskCard = React.memo(function TaskCard({
  task,
  onPress,
}: {
  task: TaskListItem;
  onPress?: (task: TaskListItem) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const handleHoverIn = useCallback(() => setIsHovered(true), []);
  const handleHoverOut = useCallback(() => setIsHovered(false), []);
  const hasSchema = !!task.payloadSchema;

  return (
    <Pressable
      onPress={() => onPress?.(task)}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      className="active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={`Task ${task.slug}${task.triggerSource ? `, source ${task.triggerSource}` : ''}`}
      accessibilityHint="Double tap to view task details"
    >
      <View className="bg-card border-border mx-4 mb-1.5 rounded-md border py-3 px-4" style={[{ borderCurve: 'continuous' }, isHovered && { opacity: 0.85 }]}>
        {/* Top row: task slug */}
        <View className="flex-row items-center gap-2 mb-1">
          <Icon as={FileCode} size={16} className="text-primary" />
          <Text className="text-mobile-body tablet:text-tablet-body font-bold text-foreground flex-1" numberOfLines={1}>
            {task.slug}
          </Text>
          {hasSchema && (
            <Badge variant="outline" className="px-1.5 py-0">
              <Icon as={Braces} size={10} className="text-muted-foreground" />
              <Text className="text-[10px] text-muted-foreground ml-0.5">Schema</Text>
            </Badge>
          )}
        </View>

        {/* File path */}
        {task.filePath ? (
          <Text className="text-mobile-caption text-muted-foreground mb-1" numberOfLines={1}>
            {task.filePath}
          </Text>
        ) : null}

        {/* Bottom row: trigger source + created */}
        <View className="flex-row items-center gap-3">
          {task.exportName && (
            <Badge variant="secondary" className="px-1.5 py-0">
              <Text className="text-[10px]">{task.exportName}</Text>
            </Badge>
          )}
          {task.triggerSource && (
            <Badge variant="secondary" className="px-1.5 py-0">
              <Text className="text-[10px]">{task.triggerSource}</Text>
            </Badge>
          )}
          {task.createdAt && (
            <Text className="text-mobile-caption text-muted-foreground">
              {formatRelativeTime(task.createdAt)}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
});
