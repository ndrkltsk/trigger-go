import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ScheduleCard } from '@/components/schedules/schedule-card';
import type { ScheduleObject } from '@/services/api/schedules';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light' },
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const createMockIcon = (name: string) => {
    const MockIcon = (props: Record<string, unknown>) => <View testID={`icon-${name}`} {...props} />;
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    Calendar: createMockIcon('Calendar'),
    Code: createMockIcon('Code'),
    Clock: createMockIcon('Clock'),
    Star: createMockIcon('Star'),
  };
});

const mockSchedule: ScheduleObject = {
  id: 'sched_abc123',
  task: 'send-weekly-report',
  active: true,
  type: 'DECLARATIVE',
  externalId: 'weekly-report',
  generator: {
    expression: '0 9 * * 1',
    description: 'Every Monday at 9:00 AM',
  },
  nextRun: new Date(Date.now() + 3600_000).toISOString(),
};

describe('ScheduleCard', () => {
  it('renders the external ID as the schedule name', () => {
    const { getByText } = render(<ScheduleCard schedule={mockSchedule} />);
    expect(getByText('weekly-report')).toBeTruthy();
  });

  it('renders Active badge when schedule is active', () => {
    const { getByText } = render(<ScheduleCard schedule={mockSchedule} />);
    expect(getByText('Active')).toBeTruthy();
  });

  it('renders Inactive badge when schedule is not active', () => {
    const inactive: ScheduleObject = { ...mockSchedule, active: false };
    const { getByText } = render(<ScheduleCard schedule={inactive} />);
    expect(getByText('Inactive')).toBeTruthy();
  });

  it('renders cron expression', () => {
    const { getByText } = render(<ScheduleCard schedule={mockSchedule} />);
    expect(getByText('0 9 * * 1')).toBeTruthy();
  });

  it('renders human description from generator', () => {
    const { getByText } = render(<ScheduleCard schedule={mockSchedule} />);
    expect(getByText('Every Monday at 9:00 AM')).toBeTruthy();
  });

  it('renders task name', () => {
    const { getByText } = render(<ScheduleCard schedule={mockSchedule} />);
    expect(getByText('send-weekly-report')).toBeTruthy();
  });

  it('renders "Managed by code" badge for DECLARATIVE type', () => {
    const { getByText } = render(<ScheduleCard schedule={mockSchedule} />);
    expect(getByText('Managed by code')).toBeTruthy();
  });

  it('renders "Custom" badge for non-DECLARATIVE type', () => {
    const custom: ScheduleObject = { ...mockSchedule, type: 'IMPERATIVE' as any };
    const { getByText } = render(<ScheduleCard schedule={custom} />);
    expect(getByText('Custom')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<ScheduleCard schedule={mockSchedule} onPress={onPress} />);
    fireEvent.press(getByText('weekly-report'));
    expect(onPress).toHaveBeenCalledWith(mockSchedule);
  });

  it('falls back to task name when externalId is missing', () => {
    const noExternal: ScheduleObject = { ...mockSchedule, externalId: undefined };
    const { getAllByText } = render(<ScheduleCard schedule={noExternal} />);
    expect(getAllByText('send-weekly-report').length).toBeGreaterThanOrEqual(1);
  });

  it('falls back to cronToHuman when generator description is missing', () => {
    const noDesc: ScheduleObject = {
      ...mockSchedule,
      generator: { expression: '*/5 * * * *' },
    };
    const { getByText } = render(<ScheduleCard schedule={noDesc} />);
    expect(getByText('Every 5 minutes')).toBeTruthy();
  });
});
