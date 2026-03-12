import React, { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { RunCard } from './run-card';
import type { ListRunItem } from '@/services/api/runs';

interface AnimatedRunCardProps {
  run: ListRunItem;
  onPress?: () => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (runId: string) => void;
  isNew?: boolean;
}

export const AnimatedRunCard = React.memo(function AnimatedRunCard({
  run,
  onPress,
  isSelectMode,
  isSelected,
  onToggleSelect,
  isNew,
}: AnimatedRunCardProps) {
  const opacity = useSharedValue(isNew ? 0 : 1);
  const translateX = useSharedValue(isNew ? -40 : 0);
  const highlightOpacity = useSharedValue(0);

  useEffect(() => {
    if (isNew) {
      cancelAnimation(opacity);
      cancelAnimation(translateX);
      cancelAnimation(highlightOpacity);
      opacity.value = 0;
      translateX.value = -40;

      opacity.value = withDelay(80, withTiming(1, { duration: 350 }));
      translateX.value = withDelay(80, withTiming(0, { duration: 350 }));

      highlightOpacity.value = withDelay(
        80,
        withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0, { duration: 600 }),
        ),
      );
    } else {
      cancelAnimation(opacity);
      cancelAnimation(translateX);
      cancelAnimation(highlightOpacity);
      opacity.value = 1;
      translateX.value = 0;
      highlightOpacity.value = 0;
    }
  }, [isNew, opacity, translateX, highlightOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const highlightStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    top: 0,
    left: 16,
    right: 16,
    bottom: 6,
    borderRadius: 6,
    backgroundColor: `rgba(34, 197, 94, ${0.08 * highlightOpacity.value})`,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Animated.View style={highlightStyle} pointerEvents="none" />
      <RunCard
        run={run}
        onPress={onPress}
        isSelectMode={isSelectMode}
        isSelected={isSelected}
        onToggleSelect={onToggleSelect}
      />
    </Animated.View>
  );
});
