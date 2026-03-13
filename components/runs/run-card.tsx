import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RunStatusBadge } from './run-status-badge';
import { getStatusConfig } from '@/lib/status-colors';
import { formatRelativeTime, formatDuration, formatCost } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ListRunItem } from '@/services/api/runs';
import { LiveDuration } from './live-duration';

const MAX_VISIBLE_TAGS = 3;

export const RunCard = React.memo(function RunCard({
  run,
  onPress,
  isSelectMode,
  isSelected,
  onToggleSelect,
}: {
  run: ListRunItem;
  onPress?: () => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (runId: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const handleHoverIn = useCallback(() => setIsHovered(true), []);
  const handleHoverOut = useCallback(() => setIsHovered(false), []);
  const config = getStatusConfig(run.status);
  const overflowCount = (run.tags?.length ?? 0) - MAX_VISIBLE_TAGS;

  const handlePress = isSelectMode
    ? () => onToggleSelect?.(run.id)
    : onPress;

  const accessibilityLabel = `Run ${run.id}, task ${run.taskIdentifier}, status ${config.label}, started ${formatRelativeTime(run.createdAt)}`;

  return (
    <Pressable
      onPress={handlePress}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      className="active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={isSelectMode ? 'Double tap to toggle selection' : 'Double tap to view run details'}
    >
      <View
        className="bg-card border-border mx-4 mb-1.5 rounded-md border py-3 pl-4 pr-3 flex-row"
        style={[
          { borderLeftWidth: 3, borderLeftColor: config.color, borderCurve: 'continuous' },
          isHovered && { opacity: 0.85 },
        ]}
      >
        {isSelectMode && (
          <View className="justify-center mr-3">
            <Checkbox
              checked={isSelected ?? false}
              onCheckedChange={() => onToggleSelect?.(run.id)}
              accessibilityLabel={`Select run ${run.id}`}
            />
          </View>
        )}
        <View className="flex-1">
        {/* Top row: task identifier */}
        <View className="flex-row items-center gap-2 mb-1">
          <Text className="text-mobile-body tablet:text-tablet-body font-bold text-foreground" numberOfLines={1}>
            {run.taskIdentifier}
          </Text>
        </View>

        {/* Middle row: run ID + status badge + time */}
        <View className="flex-row items-center gap-2 flex-wrap">
          <Text className="text-mobile-caption text-muted-foreground">
            {run.id}
          </Text>
          <RunStatusBadge status={run.status} />
          <Text className="text-mobile-caption text-muted-foreground">
            {formatRelativeTime(run.createdAt)}
          </Text>
        </View>

        {/* Duration + cost row */}
        {(config.isActive || run.durationMs != null || run.costInCents != null) && (
          <View className="flex-row items-center gap-3 mt-1">
            {config.isActive && run.startedAt ? (
              <LiveDuration startedAt={run.startedAt} />
            ) : run.durationMs != null ? (
              <Text className="text-mobile-caption text-muted-foreground">
                {formatDuration(run.durationMs)}
              </Text>
            ) : null}
            {run.costInCents != null && run.costInCents > 0 && (
              <Text className="text-mobile-caption text-muted-foreground">
                {formatCost(run.costInCents)}
              </Text>
            )}
          </View>
        )}

        {/* Tags row */}
        {run.tags && run.tags.length > 0 && (
          <View className="flex-row flex-wrap gap-1 mt-2">
            {run.tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
              <Badge key={tag} variant="outline" className="px-1.5 py-0">
                <Text className="text-[10px] text-muted-foreground">{tag}</Text>
              </Badge>
            ))}
            {overflowCount > 0 && (
              <Text className="text-[10px] text-muted-foreground self-center">
                +{overflowCount} more
              </Text>
            )}
          </View>
        )}
        </View>
      </View>
    </Pressable>
  );
});
