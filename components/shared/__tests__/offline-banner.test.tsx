import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { OfflineBanner } from '@/components/shared/offline-banner';
import { useNetworkStore } from '@/stores/network-store';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return {
    WifiOff: (props: Record<string, unknown>) => <View testID="icon-WifiOff" {...props} />,
  };
});

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: ({ children, style }: { children: React.ReactNode; style?: unknown }) => (
        <View style={style}>{children}</View>
      ),
    },
    useAnimatedStyle: (fn: () => Record<string, unknown>) => fn(),
    useReducedMotion: () => false,
    withSpring: (val: number) => val,
    withTiming: (val: number) => val,
  };
});

jest.mock('@/lib/format', () => ({
  formatRelativeTime: () => '2 minutes ago',
}));

beforeEach(() => {
  useNetworkStore.setState({ isConnected: true, lastSyncTime: null });
});

describe('OfflineBanner', () => {
  it('renders without crashing when online', () => {
    const { queryByText } = render(<OfflineBanner />);
    // The text is present but animated to 0 opacity when online
    expect(queryByText('You are offline')).toBeTruthy();
  });

  it('shows offline text when isConnected is false', () => {
    useNetworkStore.setState({ isConnected: false });
    render(<OfflineBanner />);
    expect(screen.getByText('You are offline')).toBeTruthy();
  });

  it('shows WifiOff icon when offline', () => {
    useNetworkStore.setState({ isConnected: false });
    const { getByTestId } = render(<OfflineBanner />);
    expect(getByTestId('icon-WifiOff')).toBeTruthy();
  });

  it('shows last sync time when available', () => {
    useNetworkStore.setState({
      isConnected: false,
      lastSyncTime: '2025-01-01T00:00:00Z',
    });
    render(<OfflineBanner />);
    expect(screen.getByText(/Last updated/)).toBeTruthy();
  });

  it('does not show last sync time when null', () => {
    useNetworkStore.setState({ isConnected: false, lastSyncTime: null });
    const { queryByText } = render(<OfflineBanner />);
    expect(queryByText(/Last updated/)).toBeNull();
  });
});
