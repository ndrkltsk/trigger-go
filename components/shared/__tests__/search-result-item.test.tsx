import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SearchResultItem } from '@/components/shared/search-result-item';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const createMockIcon = (name: string) => {
    const MockIcon = (props: Record<string, unknown>) => <View testID={`icon-${name}`} {...props} />;
    MockIcon.displayName = name;
    return MockIcon;
  };
  return {
    Play: createMockIcon('Play'),
    Layers: createMockIcon('Layers'),
    CalendarClock: createMockIcon('CalendarClock'),
  };
});

jest.mock('@/components/ui/icon', () => {
  const { View } = require('react-native');
  return {
    Icon: ({ as: IconComponent, ...props }: { as: React.ComponentType<any> }) => (
      <View testID="icon-wrapper"><IconComponent {...props} /></View>
    ),
  };
});

describe('SearchResultItem', () => {
  it('renders run type with title', () => {
    const { getByText } = render(
      <SearchResultItem type="run" title="run_abc123" onPress={jest.fn()} />
    );
    expect(getByText('run_abc123')).toBeTruthy();
  });

  it('renders task type with title', () => {
    const { getByText } = render(
      <SearchResultItem type="task" title="send-email" onPress={jest.fn()} />
    );
    expect(getByText('send-email')).toBeTruthy();
  });

  it('renders schedule type with title and subtitle', () => {
    const { getByText } = render(
      <SearchResultItem
        type="schedule"
        title="daily-report"
        subtitle="generate-report"
        onPress={jest.fn()}
      />
    );
    expect(getByText('daily-report')).toBeTruthy();
    expect(getByText('generate-report')).toBeTruthy();
  });

  it('renders status badge when provided', () => {
    const { View, Text } = require('react-native');
    const badge = <Text>COMPLETED</Text>;
    const { getByText } = render(
      <SearchResultItem type="run" title="run_123" statusBadge={badge} onPress={jest.fn()} />
    );
    expect(getByText('COMPLETED')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <SearchResultItem type="run" title="run_123" onPress={onPress} />
    );
    fireEvent.press(getByText('run_123'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
