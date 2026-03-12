import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { RecentActivity } from '@/components/dashboard/recent-activity';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const Icon = (props: any) => <View testID="icon" />;
  return {
    CalendarClock: Icon,
    Inbox: Icon,
    Play: Icon,
    Layers: Icon,
    Rocket: Icon,
    AlertTriangle: Icon,
    Zap: Icon,
  };
});

jest.mock('@/lib/format', () => ({
  formatRelativeTime: (d: string) => 'just now',
  formatDuration: (ms: number) => '1s',
  formatCost: () => '$0.01',
}));

jest.mock('@/lib/status-colors', () => ({
  getStatusConfig: (status: string) => ({
    label: status,
    color: '#8B95A5',
    bgClass: '',
    textClass: '',
    icon: '',
    isTerminal: false,
    isActive: false,
  }),
}));

jest.mock('@/components/runs/run-status-badge', () => {
  const { View, Text } = require('react-native');
  return {
    RunStatusBadge: ({ status }: { status: string }) => (
      <View>
        <Text>{status}</Text>
      </View>
    ),
  };
});

const mockRuns = [
  {
    id: 'run_1',
    status: 'FAILED',
    taskIdentifier: 'my-task',
    createdAt: '2025-01-01T00:00:00Z',
    tags: [],
  },
  {
    id: 'run_2',
    status: 'COMPLETED',
    taskIdentifier: 'other-task',
    createdAt: '2025-01-01T01:00:00Z',
    tags: [],
  },
] as any;

beforeEach(() => {
  mockPush.mockClear();
});

describe('RecentActivity', () => {
  it('renders runs', () => {
    render(<RecentActivity runs={mockRuns} nextSchedule={null} isLoading={false} />);
    expect(screen.getByText('Recent Activity')).toBeTruthy();
    expect(screen.getByText('my-task')).toBeTruthy();
    expect(screen.getByText('other-task')).toBeTruthy();
  });

  it('shows empty state when no runs', () => {
    render(<RecentActivity runs={[]} nextSchedule={null} isLoading={false} />);
    expect(screen.getByText('No recent activity')).toBeTruthy();
  });

  it('shows next scheduled run info', () => {
    const schedule = { id: 's1', task: 'cron-job', nextRun: '2025-06-01T12:00:00Z', active: true };
    render(<RecentActivity runs={mockRuns} nextSchedule={schedule as any} isLoading={false} />);
    expect(screen.getByText(/cron-job/)).toBeTruthy();
  });

  it('navigates to runs list on "See all runs"', () => {
    render(<RecentActivity runs={mockRuns} nextSchedule={null} isLoading={false} />);
    fireEvent.press(screen.getByText('See all runs'));
    expect(mockPush).toHaveBeenCalledWith('/(dashboard)/(runs)');
  });

  it('navigates to run detail on run press', () => {
    render(<RecentActivity runs={mockRuns} nextSchedule={null} isLoading={false} />);
    fireEvent.press(screen.getByText('my-task'));
    expect(mockPush).toHaveBeenCalledWith('/(dashboard)/(runs)/run_1');
  });
});
