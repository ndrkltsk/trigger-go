import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RunCard } from '@/components/runs/run-card';
import type { ListRunItem } from '@/services/api/runs';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const createMockIcon = (name: string) => {
    const MockIcon = (props: Record<string, unknown>) => <View testID={`icon-${name}`} {...props} />;
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    CheckCircle: createMockIcon('CheckCircle'),
    XOctagon: createMockIcon('XOctagon'),
    Clock: createMockIcon('Clock'),
    RefreshCw: createMockIcon('RefreshCw'),
    Pause: createMockIcon('Pause'),
    XCircle: createMockIcon('XCircle'),
    AlertTriangle: createMockIcon('AlertTriangle'),
    Slash: createMockIcon('Slash'),
    ServerCrash: createMockIcon('ServerCrash'),
    Loader: createMockIcon('Loader'),
    TimerOff: createMockIcon('TimerOff'),
    HelpCircle: createMockIcon('HelpCircle'),
  };
});

const mockRun: ListRunItem = {
  id: 'run_abc123',
  status: 'COMPLETED',
  taskIdentifier: 'my-email-task',
  isTest: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  env: { id: 'env_1', name: 'dev' },
  durationMs: 2500,
  costInCents: 0.12,
  tags: ['user_123', 'org_456'],
};

describe('RunCard', () => {
  it('renders task identifier', () => {
    const { getByText } = render(<RunCard run={mockRun} />);
    expect(getByText('my-email-task')).toBeTruthy();
  });

  it('renders run ID', () => {
    const { getByText } = render(<RunCard run={mockRun} />);
    expect(getByText('run_abc123')).toBeTruthy();
  });

  it('renders status badge with correct label', () => {
    const { getByText } = render(<RunCard run={mockRun} />);
    expect(getByText('Completed')).toBeTruthy();
  });

  it('renders tags', () => {
    const { getByText } = render(<RunCard run={mockRun} />);
    expect(getByText('user_123')).toBeTruthy();
    expect(getByText('org_456')).toBeTruthy();
  });

  it('shows overflow count for many tags', () => {
    const runWithManyTags: ListRunItem = {
      ...mockRun,
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
    };
    const { getByText } = render(<RunCard run={runWithManyTags} />);
    expect(getByText('+2 more')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<RunCard run={mockRun} onPress={onPress} />);
    fireEvent.press(getByText('my-email-task'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
