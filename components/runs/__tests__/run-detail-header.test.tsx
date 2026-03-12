import React from 'react';
import { render } from '@testing-library/react-native';
import { RunDetailHeader } from '@/components/runs/run-detail-header';
import type { RetrieveRunResponse } from '@/services/api/runs';

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

const mockRun: RetrieveRunResponse = {
  id: 'run_abc123',
  status: 'COMPLETED',
  taskIdentifier: 'my-email-task',
  isTest: false,
  createdAt: '2025-01-15T10:42:00.000Z',
  updatedAt: '2025-01-15T10:42:10.000Z',
  startedAt: '2025-01-15T10:42:00.000Z',
  finishedAt: '2025-01-15T10:42:10.000Z',
  durationMs: 10000,
  costInCents: 0.25,
  version: '20250115.1',
  attempts: [],
};

describe('RunDetailHeader', () => {
  it('renders task identifier', () => {
    const { getByText } = render(<RunDetailHeader run={mockRun} />);
    expect(getByText('my-email-task')).toBeTruthy();
  });

  it('renders run ID', () => {
    const { getByText } = render(<RunDetailHeader run={mockRun} />);
    expect(getByText('run_abc123')).toBeTruthy();
  });

  it('renders status badge', () => {
    const { getByText } = render(<RunDetailHeader run={mockRun} />);
    expect(getByText('Completed')).toBeTruthy();
  });

  it('renders formatted duration', () => {
    const { getByText } = render(<RunDetailHeader run={mockRun} />);
    expect(getByText('10.0s')).toBeTruthy();
  });

  it('renders formatted cost', () => {
    const { getByText } = render(<RunDetailHeader run={mockRun} />);
    expect(getByText('$0.0025')).toBeTruthy();
  });

  it('renders version when present', () => {
    const { getByText } = render(<RunDetailHeader run={mockRun} />);
    expect(getByText('20250115.1')).toBeTruthy();
  });

  it('shows "In progress" when run is not finished', () => {
    const activeRun: RetrieveRunResponse = {
      ...mockRun,
      status: 'EXECUTING',
      finishedAt: undefined,
    };
    const { getByText } = render(<RunDetailHeader run={activeRun} />);
    expect(getByText('In progress')).toBeTruthy();
  });

  it('shows Test Run label when isTest is true', () => {
    const testRun: RetrieveRunResponse = {
      ...mockRun,
      isTest: true,
    };
    const { getByText } = render(<RunDetailHeader run={testRun} />);
    expect(getByText('Yes')).toBeTruthy();
  });
});
