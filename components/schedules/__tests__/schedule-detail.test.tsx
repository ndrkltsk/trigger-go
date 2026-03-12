import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ScheduleDetailScreen from '@/app/(dashboard)/(settings)/schedule/[scheduleId]';
import type { ScheduleObject } from '@/services/api/schedules';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const createMockIcon = (name: string) => {
    const MockIcon = (props: Record<string, unknown>) => <View testID={`icon-${name}`} {...props} />;
    MockIcon.displayName = name;
    return MockIcon;
  };
  return {
    Info: createMockIcon('Info'),
  };
});

const mockSchedule: ScheduleObject = {
  id: 'sched_abc123',
  task: 'send-weekly-report',
  active: true,
  type: 'DECLARATIVE',
  externalId: 'weekly-report',
  timezone: 'America/New_York',
  deduplicationKey: 'dedup_weekly',
  generator: {
    expression: '0 9 * * 1',
    description: 'Every Monday at 9:00 AM',
  },
  nextRun: new Date(Date.now() + 3600_000).toISOString(),
};

const mockUseSchedule = jest.fn();
const mockMutate = jest.fn();
const mockToggleActive = { mutate: mockMutate, isPending: false };
const mockDeleteMutateAsync = jest.fn();
const mockDeleteSchedule = { mutateAsync: mockDeleteMutateAsync, isPending: false };
const mockUpdateSchedule = { mutateAsync: jest.fn(), isPending: false };
jest.mock('@/hooks/api/use-schedules', () => ({
  useSchedule: (...args: unknown[]) => mockUseSchedule(...args),
  useToggleScheduleActive: () => mockToggleActive,
  useDeleteSchedule: () => mockDeleteSchedule,
  useUpdateSchedule: () => mockUpdateSchedule,
  useTimezones: () => ({ data: ['UTC', 'America/New_York'] }),
}));

jest.mock('@/hooks/api/use-tasks', () => ({
  useTasksList: () => ({ tasks: [], isLoading: false }),
}));

const mockRouter = { back: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ scheduleId: 'sched_abc123' }),
  useRouter: () => mockRouter,
  Stack: {
    Screen: ({ options }: { options: Record<string, unknown> }) => null,
  },
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Warning: 'warning' },
}));

jest.mock('@/stores/toast-store', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

jest.mock('@/components/schedules/schedule-form-sheet', () => {
  const { View } = require('react-native');
  const React = require('react');
  const ScheduleFormSheet = React.forwardRef(
    (props: Record<string, unknown>, ref: React.Ref<unknown>) => {
      React.useImperativeHandle(ref, () => ({
        presentCreate: jest.fn(),
        presentEdit: jest.fn(),
        dismiss: jest.fn(),
      }));
      return <View testID="schedule-form-sheet" />;
    }
  );
  ScheduleFormSheet.displayName = 'ScheduleFormSheet';
  return { ScheduleFormSheet };
});

jest.mock('@/components/shared/confirm-sheet', () => {
  const { View } = require('react-native');
  const React = require('react');
  const ConfirmSheet = React.forwardRef(
    (props: Record<string, unknown>, ref: React.Ref<unknown>) => {
      React.useImperativeHandle(ref, () => ({
        present: jest.fn(),
        dismiss: jest.fn(),
      }));
      return <View testID="confirm-sheet" {...props} />;
    }
  );
  ConfirmSheet.displayName = 'ConfirmSheet';
  return { ConfirmSheet, ConfirmSheetRef: {} };
});

describe('ScheduleDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading skeleton when loading', () => {
    mockUseSchedule.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByTestId, queryByText } = render(<ScheduleDetailScreen />);
    // Should not show schedule data
    expect(queryByText('sched_abc123')).toBeNull();
  });

  it('renders error state on error', () => {
    mockUseSchedule.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
      refetch: jest.fn(),
    });

    const { getByText } = render(<ScheduleDetailScreen />);
    expect(getByText('Network error')).toBeTruthy();
    expect(getByText('Try again')).toBeTruthy();
  });

  it('renders all fields for a declarative schedule', () => {
    mockUseSchedule.mockReturnValue({
      data: mockSchedule,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText, getAllByText } = render(<ScheduleDetailScreen />);

    // Header - externalId appears as both header title and External ID row
    expect(getAllByText('weekly-report').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Active')).toBeTruthy();
    expect(getByText('Managed by code')).toBeTruthy();

    // Configuration
    expect(getByText('sched_abc123')).toBeTruthy();
    expect(getByText('send-weekly-report')).toBeTruthy();
    expect(getByText('0 9 * * 1')).toBeTruthy();
    expect(getByText('Every Monday at 9:00 AM')).toBeTruthy();
    expect(getByText('America/New_York')).toBeTruthy();
    expect(getByText('dedup_weekly')).toBeTruthy();

    // Info banner
    expect(
      getByText('This schedule is managed by code and cannot be edited from the app.')
    ).toBeTruthy();
  });

  it('does not show action buttons for declarative schedules', () => {
    mockUseSchedule.mockReturnValue({
      data: mockSchedule,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { queryByText } = render(<ScheduleDetailScreen />);
    expect(queryByText('Edit Schedule')).toBeNull();
    expect(queryByText('Delete Schedule')).toBeNull();
  });

  it('shows action buttons for custom schedules', () => {
    const customSchedule: ScheduleObject = {
      ...mockSchedule,
      type: 'IMPERATIVE',
    };
    mockUseSchedule.mockReturnValue({
      data: customSchedule,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText, queryByText } = render(<ScheduleDetailScreen />);
    expect(getByText('Edit Schedule')).toBeTruthy();
    expect(getByText('Deactivate')).toBeTruthy();
    expect(getByText('Delete Schedule')).toBeTruthy();
    expect(getByText('Custom')).toBeTruthy();

    // No info banner
    expect(
      queryByText('This schedule is managed by code and cannot be edited from the app.')
    ).toBeNull();
  });

  it('shows Activate button when schedule is inactive', () => {
    const inactiveCustom: ScheduleObject = {
      ...mockSchedule,
      type: 'IMPERATIVE',
      active: false,
    };
    mockUseSchedule.mockReturnValue({
      data: inactiveCustom,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText } = render(<ScheduleDetailScreen />);
    expect(getByText('Inactive')).toBeTruthy();
    expect(getByText('Activate')).toBeTruthy();
  });

  it('calls toggle mutation when Deactivate is pressed', () => {
    const customSchedule: ScheduleObject = {
      ...mockSchedule,
      type: 'IMPERATIVE',
    };
    mockUseSchedule.mockReturnValue({
      data: customSchedule,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText } = render(<ScheduleDetailScreen />);
    fireEvent.press(getByText('Deactivate'));
    expect(mockMutate).toHaveBeenCalledWith({
      scheduleId: 'sched_abc123',
      active: true,
    });
  });

  it('calls toggle mutation when Activate is pressed', () => {
    const inactiveCustom: ScheduleObject = {
      ...mockSchedule,
      type: 'IMPERATIVE',
      active: false,
    };
    mockUseSchedule.mockReturnValue({
      data: inactiveCustom,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText } = render(<ScheduleDetailScreen />);
    fireEvent.press(getByText('Activate'));
    expect(mockMutate).toHaveBeenCalledWith({
      scheduleId: 'sched_abc123',
      active: false,
    });
  });

  it('defaults timezone to UTC when not provided', () => {
    const noTz: ScheduleObject = { ...mockSchedule, timezone: undefined };
    mockUseSchedule.mockReturnValue({
      data: noTz,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText } = render(<ScheduleDetailScreen />);
    expect(getByText('UTC')).toBeTruthy();
  });
});
