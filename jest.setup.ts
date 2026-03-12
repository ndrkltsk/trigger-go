import '@testing-library/jest-native/extend-expect';

// Mock react-native-reanimated for tests
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  const AnimatedView = React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) => (
    React.createElement(View, { ...props, ref })
  ));
  AnimatedView.displayName = 'Animated.View';
  return {
    __esModule: true,
    default: { View: AnimatedView },
    useSharedValue: (v: number) => ({ value: v }),
    useDerivedValue: (fn: () => number) => ({ value: fn() }),
    useAnimatedStyle: (fn: () => Record<string, unknown>) => fn(),
    withTiming: (v: unknown) => v,
    withSpring: (v: unknown) => v,
    withRepeat: (v: unknown) => v,
    cancelAnimation: jest.fn(),
    useReducedMotion: () => false,
    interpolate: (_input: number, _inputRange: number[], outputRange: number[]) => outputRange[0],
    Extrapolation: { CLAMP: 'clamp' },
    Easing: {
      inOut: () => undefined,
      ease: undefined,
    },
    FadeIn: { duration: () => ({ delay: () => ({}) }) },
    FadeOut: { duration: () => ({}) },
  };
});

// Mock expo-secure-store for tests
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock @react-native-community/netinfo for tests
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn().mockResolvedValue({ isConnected: true }),
}), { virtual: true });

// Mock react-native-mmkv for tests
jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    getBoolean: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
  })),
}));
