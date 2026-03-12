import React from 'react';
import { render } from '@testing-library/react-native';
import { RunStatusBadge } from '@/components/runs/run-status-badge';

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

describe('RunStatusBadge', () => {
  it('renders the correct label for COMPLETED', () => {
    const { getByText } = render(<RunStatusBadge status="COMPLETED" />);
    expect(getByText('Completed')).toBeTruthy();
  });

  it('renders the correct label for EXECUTING', () => {
    const { getByText } = render(<RunStatusBadge status="EXECUTING" />);
    expect(getByText('Running')).toBeTruthy();
  });

  it('renders the correct label for FAILED', () => {
    const { getByText } = render(<RunStatusBadge status="FAILED" />);
    expect(getByText('Failed')).toBeTruthy();
  });

  it('renders the correct label for REATTEMPTING', () => {
    const { getByText } = render(<RunStatusBadge status="REATTEMPTING" />);
    expect(getByText('Retrying')).toBeTruthy();
  });

  it('handles unknown status with fallback', () => {
    const { getByText } = render(<RunStatusBadge status="UNKNOWN_STATUS" />);
    expect(getByText('UNKNOWN_STATUS')).toBeTruthy();
  });

  it('re-renders with new status on status change', () => {
    const { getByText, rerender } = render(<RunStatusBadge status="EXECUTING" />);
    expect(getByText('Running')).toBeTruthy();

    rerender(<RunStatusBadge status="COMPLETED" />);
    expect(getByText('Completed')).toBeTruthy();
  });
});
