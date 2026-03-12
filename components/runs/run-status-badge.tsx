import React, { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { getStatusConfig } from '@/lib/status-colors';
import { cn } from '@/lib/utils';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  Easing,
  cancelAnimation,
  useReducedMotion,
} from 'react-native-reanimated';
import {
  CheckCircle,
  XOctagon,
  Clock,
  RefreshCw,
  Pause,
  XCircle,
  AlertTriangle,
  Slash,
  ServerCrash,
  Loader,
  TimerOff,
  HelpCircle,
} from 'lucide-react-native';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  'check-circle': CheckCircle,
  'x-octagon': XOctagon,
  clock: Clock,
  'refresh-cw': RefreshCw,
  pause: Pause,
  'x-circle': XCircle,
  'alert-triangle': AlertTriangle,
  slash: Slash,
  'server-crash': ServerCrash,
  loader: Loader,
  'timer-off': TimerOff,
  'help-circle': HelpCircle,
};

export const RunStatusBadge = React.memo(function RunStatusBadge({
  status,
}: {
  status: string;
}) {
  const config = getStatusConfig(status);
  const IconComponent = ICON_MAP[config.icon] ?? HelpCircle;
  const prevStatus = useRef(status);
  const reducedMotion = useReducedMotion();

  const fadeOpacity = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);

  // Fade transition when status changes
  useEffect(() => {
    if (prevStatus.current !== status && !reducedMotion) {
      fadeOpacity.value = 0;
      fadeOpacity.value = withTiming(1, { duration: 150, easing: Easing.inOut(Easing.ease) });
    }
    prevStatus.current = status;
  }, [status, fadeOpacity, reducedMotion]);

  // Pulse animation for EXECUTING status
  useEffect(() => {
    if (status === 'EXECUTING' && !reducedMotion) {
      pulseOpacity.value = withRepeat(
        withTiming(0.5, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      cancelAnimation(pulseOpacity);
      pulseOpacity.value = 1;
    }

    return () => {
      cancelAnimation(pulseOpacity);
    };
  }, [status, pulseOpacity, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value * pulseOpacity.value,
  }));

  return (
    <Animated.View style={animatedStyle} accessibilityLabel={`Status: ${config.label}`} accessibilityRole="text">
      <Badge variant="outline" className={cn('gap-1 border-transparent px-2 py-0.5', config.bgClass)}>
        <IconComponent size={12} color={config.color} />
        <Text className="text-mobile-caption font-semibold" style={{ color: config.color }}>{config.label}</Text>
      </Badge>
    </Animated.View>
  );
});
