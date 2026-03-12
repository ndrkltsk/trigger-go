import { useEffect, useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Text } from '@/components/ui/text';
import { useToastStore, type ToastType } from '@/stores/toast-store';

const BORDER_COLORS: Record<ToastType, string> = {
  success: 'border-l-green-500',
  error: 'border-l-red-500',
  info: 'border-l-blue-500',
  warning: 'border-l-yellow-500',
};

export function ToastContainer() {
  const toast = useToastStore((s) => s.toast);
  const dismissToast = useToastStore((s) => s.dismissToast);
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const dismiss = useCallback(() => {
    translateY.value = withTiming(-100, { duration: 150 });
    opacity.value = withTiming(0, { duration: 150 }, () => {
      runOnJS(dismissToast)();
    });
  }, [dismissToast, translateY, opacity]);

  useEffect(() => {
    if (toast) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 200 });

      if (toast.type === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (toast.type === 'error') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      const timer = setTimeout(dismiss, toast.duration ?? 3000);
      return () => clearTimeout(timer);
    }
  }, [toast?.id]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY < 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY < -30) {
        runOnJS(dismiss)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  if (!toast) return null;

  const borderClass = BORDER_COLORS[toast.type];

  return (
    <Animated.View
      style={[{ position: 'absolute', top: insets.top + 64, left: 16, right: 16, zIndex: 9999 }, animatedStyle]}
    >
      <GestureDetector gesture={swipeGesture}>
        <View
          className={`rounded-lg bg-card border border-border border-l-4 ${borderClass} px-4 py-3 shadow-lg shadow-black/10 flex-row items-center`}
        >
          <View className="flex-1 mr-2">
            <Text className="text-sm font-semibold text-foreground">{toast.title}</Text>
            {toast.message && (
              <Text className="text-xs text-muted-foreground mt-0.5">{toast.message}</Text>
            )}
          </View>
          {toast.action && (
            <Pressable
              onPress={() => {
                toast.action?.onPress();
                dismiss();
              }}
              className="px-3 py-1 rounded-md bg-primary"
            >
              <Text className="text-xs font-semibold text-primary-foreground">
                {toast.action.label}
              </Text>
            </Pressable>
          )}
        </View>
      </GestureDetector>
    </Animated.View>
  );
}
