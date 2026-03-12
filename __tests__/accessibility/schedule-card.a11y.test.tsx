import React from 'react';
import { render } from '@testing-library/react-native';
import { ScheduleCard } from '@/components/schedules/schedule-card';
import type { ScheduleObject } from '@/services/api/schedules';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy({}, {
    get: (_target: Record<string, unknown>, name: string) => {
      const Icon = (props: Record<string, unknown>) => <View testID={`icon-${name}`} {...props} />;
      Icon.displayName = name;
      return Icon;
    },
  });
});

const mockSchedule: ScheduleObject = {
  id: 'sched_abc123',
  task: 'cleanup-job',
  active: true,
  type: 'DECLARATIVE',
  externalId: 'daily-cleanup',
  generator: {
    expression: '0 3 * * *',
    description: 'Every day at 3:00 AM',
  },
  nextRun: new Date(Date.now() + 3600000).toISOString(),
  environments: [{ id: 'env_1', type: 'PRODUCTION' }],
};

describe('ScheduleCard accessibility', () => {
  it('has buttons with accessibility roles', () => {
    const { getAllByRole } = render(
      <ScheduleCard schedule={mockSchedule} onPress={jest.fn()} />
    );
    // Main card button + favorite button
    expect(getAllByRole('button').length).toBeGreaterThanOrEqual(1);
  });

  it('accessibility label on card contains schedule name and status', () => {
    const { getAllByLabelText } = render(
      <ScheduleCard schedule={mockSchedule} onPress={jest.fn()} />
    );
    // Card label: "daily-cleanup, Active, Every day at 3:00 AM, ..."
    const matches = getAllByLabelText(/daily-cleanup.*Active/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('accessibility label indicates inactive when not active', () => {
    const inactive = { ...mockSchedule, active: false };
    const { getAllByLabelText } = render(
      <ScheduleCard schedule={inactive} onPress={jest.fn()} />
    );
    const matches = getAllByLabelText(/daily-cleanup.*Inactive/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('decorative icons are hidden from accessibility', () => {
    const { getByTestId } = render(
      <ScheduleCard schedule={mockSchedule} onPress={jest.fn()} />
    );
    const calendarIcon = getByTestId('icon-Calendar');
    expect(calendarIcon.props.importantForAccessibility).toBe('no');
  });
});
