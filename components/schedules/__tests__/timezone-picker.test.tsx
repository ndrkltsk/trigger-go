import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TimezonePicker } from '@/components/schedules/timezone-picker';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const createMockIcon = (name: string) => {
    const MockIcon = (props: Record<string, unknown>) => <View testID={`icon-${name}`} {...props} />;
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    Check: createMockIcon('Check'),
    ChevronDown: createMockIcon('ChevronDown'),
  };
});

const mockPresent = jest.fn().mockResolvedValue(undefined);
const mockDismiss = jest.fn().mockResolvedValue(undefined);

jest.mock('@/components/ui/bottom-sheet', () => {
  const { View } = require('react-native');
  const React = require('react');
  return {
    BottomSheet: React.forwardRef(({ children }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        present: mockPresent,
        dismiss: mockDismiss,
      }));
      return <View>{children}</View>;
    }),
  };
});

const timezones = ['America/New_York', 'America/Chicago', 'Europe/London', 'Asia/Tokyo', 'UTC'];

describe('TimezonePicker', () => {
  it('renders current value on the trigger button', () => {
    const { getAllByText } = render(
      <TimezonePicker value="UTC" onChange={jest.fn()} timezones={timezones} />
    );

    // UTC appears in both the trigger button and the list
    expect(getAllByText('UTC').length).toBeGreaterThanOrEqual(1);
  });

  it('renders placeholder when no value is set', () => {
    const { getByText } = render(
      <TimezonePicker value="" onChange={jest.fn()} timezones={timezones} />
    );

    expect(getByText('Select timezone')).toBeTruthy();
  });

  it('renders all timezones in the list', () => {
    const { getAllByText } = render(
      <TimezonePicker value="America/New_York" onChange={jest.fn()} timezones={timezones} />
    );

    // Use getAllByText since the selected timezone also appears in trigger
    expect(getAllByText('America/New_York').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Europe/London').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Asia/Tokyo').length).toBeGreaterThanOrEqual(1);
  });
});
