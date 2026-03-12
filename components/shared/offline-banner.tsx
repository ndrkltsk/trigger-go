import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, withSpring, useReducedMotion } from 'react-native-reanimated';
import { WifiOff } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { useNetworkStore } from '@/stores/network-store';
import { formatRelativeTime } from '@/lib/format';

export function OfflineBanner() {
  const isConnected = useNetworkStore((s) => s.isConnected);
  const lastSyncTime = useNetworkStore((s) => s.lastSyncTime);
  const reducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => {
    const targetHeight = isConnected ? 0 : 40;
    const targetOpacity = isConnected ? 0 : 1;
    return {
      height: reducedMotion ? targetHeight : withSpring(targetHeight, { damping: 20, stiffness: 200 }),
      opacity: reducedMotion ? targetOpacity : withTiming(targetOpacity, { duration: 200 }),
    };
  });

  const lastSyncLabel = lastSyncTime
    ? `Last updated ${formatRelativeTime(lastSyncTime)}`
    : undefined;

  const a11yLabel = lastSyncLabel
    ? `You are offline. ${lastSyncLabel}`
    : 'You are offline';

  return (
    <Animated.View style={[{ overflow: 'hidden' }, animatedStyle]}>
      <View
        className="bg-yellow-600 px-4 py-2 flex-row items-center gap-2"
        accessibilityRole="alert"
        accessibilityLabel={a11yLabel}
        accessibilityLiveRegion="polite"
      >
        <WifiOff size={14} color="#fff" importantForAccessibility="no" />
        <Text className="text-xs font-medium text-white flex-1">You are offline</Text>
        {lastSyncLabel && (
          <Text className="text-[10px] text-white/70">{lastSyncLabel}</Text>
        )}
      </View>
    </Animated.View>
  );
}
