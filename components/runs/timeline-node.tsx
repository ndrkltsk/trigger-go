import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { formatDuration, formatDateTime } from '@/lib/format';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
  useReducedMotion,
} from 'react-native-reanimated';
import type { TimelineNode as TimelineNodeType } from '@/lib/timeline';

const STATE_COLORS: Record<string, string> = {
  created: '#8B95A5',
  delayed: '#8B95A5',
  queued: '#8B95A5',
  executing: '#3B82F6',
  completed: '#22C55E',
  failed: '#EF4444',
  canceled: '#8B95A5',
  expired: '#8B95A5',
  'attempt-failed': '#EF4444',
  'attempt-completed': '#22C55E',
  'retry-delay': '#F59E0B',
};

interface TimelineNodeProps {
  node: TimelineNodeType;
  isLast: boolean;
}

export const TimelineNodeComponent = React.memo(function TimelineNodeComponent({
  node,
  isLast,
}: TimelineNodeProps) {
  const color = STATE_COLORS[node.state] ?? '#8B95A5';
  const reducedMotion = useReducedMotion();
  const pulseOpacity = useSharedValue(1);

  React.useEffect(() => {
    if (node.isActive && !reducedMotion) {
      pulseOpacity.value = withRepeat(
        withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      cancelAnimation(pulseOpacity);
      pulseOpacity.value = 1;
    }
    return () => cancelAnimation(pulseOpacity);
  }, [node.isActive, pulseOpacity, reducedMotion]);

  const animatedDotStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const a11yLabel = [
    node.label,
    formatDateTime(node.timestamp),
    node.duration != null && node.duration > 0 ? formatDuration(node.duration) : null,
  ].filter(Boolean).join(', ');

  return (
    <View className="flex-row" accessibilityLabel={a11yLabel}>
      {/* Timeline track: dot + line */}
      <View className="items-center w-6 mr-3">
        {/* Row with dot aligned to the label */}
        <View style={{ height: 20, justifyContent: 'center' }}>
          <Animated.View
            style={[
              {
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: color,
              },
              animatedDotStyle,
            ]}
          />
        </View>
        {!isLast && (
          <View
            className="flex-1 w-0.5"
            style={{
              backgroundColor: color,
              opacity: 0.3,
              minHeight: 24,
            }}
          />
        )}
      </View>

      {/* Content */}
      <View className="flex-1 pb-4">
        <Text style={{ lineHeight: 20 }} className="text-mobile-secondary font-semibold text-foreground">{node.label}</Text>
        <Text className="text-mobile-caption text-muted-foreground">{formatDateTime(node.timestamp)}</Text>
        {node.duration != null && node.duration > 0 && (
          <Text className="text-mobile-caption text-muted-foreground mt-0.5">
            {formatDuration(node.duration)}
          </Text>
        )}
      </View>
    </View>
  );
});
