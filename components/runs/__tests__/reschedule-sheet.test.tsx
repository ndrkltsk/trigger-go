import React, { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { RescheduleSheet } from '../reschedule-sheet';
import type { BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';

// Mock lucide-react-native
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const mockIcon = (name: string) => {
    const MockIcon = (props: any) => <View testID={`icon-${name}`} {...props} />;
    MockIcon.displayName = name;
    return MockIcon;
  };
  return {
    X: mockIcon('X'),
  };
});

// Mock nativewind
jest.mock('nativewind', () => ({
  cssInterop: jest.fn(),
}));

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

describe('RescheduleSheet', () => {
  const defaultProps = {
    currentDelayedUntil: '2024-01-15T14:30:00Z',
    onConfirm: jest.fn(),
    isPending: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the title', () => {
    const ref = createRef<BottomSheetRef>();
    render(<RescheduleSheet ref={ref} {...defaultProps} />);
    expect(screen.getByText('Reschedule Run')).toBeTruthy();
  });

  it('displays the current delayed-until time', () => {
    const ref = createRef<BottomSheetRef>();
    render(<RescheduleSheet ref={ref} {...defaultProps} />);
    expect(screen.getByText(/Currently delayed until/)).toBeTruthy();
  });

  it('renders all preset buttons', () => {
    const ref = createRef<BottomSheetRef>();
    render(<RescheduleSheet ref={ref} {...defaultProps} />);
    expect(screen.getByText('15 minutes')).toBeTruthy();
    expect(screen.getByText('1 hour')).toBeTruthy();
    expect(screen.getByText('6 hours')).toBeTruthy();
    expect(screen.getByText('1 day')).toBeTruthy();
  });

  it('renders the custom delay input', () => {
    const ref = createRef<BottomSheetRef>();
    render(<RescheduleSheet ref={ref} {...defaultProps} />);
    expect(screen.getByPlaceholderText('e.g. 2h30m, 45m, 1d')).toBeTruthy();
  });

  it('calls onConfirm with preset delay when confirmed', () => {
    const ref = createRef<BottomSheetRef>();
    render(<RescheduleSheet ref={ref} {...defaultProps} />);
    fireEvent.press(screen.getByText('1 hour'));
    fireEvent.press(screen.getByText('Reschedule'));
    expect(defaultProps.onConfirm).toHaveBeenCalledWith('1h');
  });

  it('calls onConfirm with custom delay when confirmed', () => {
    const ref = createRef<BottomSheetRef>();
    render(<RescheduleSheet ref={ref} {...defaultProps} />);
    fireEvent.changeText(
      screen.getByPlaceholderText('e.g. 2h30m, 45m, 1d'),
      '2h30m'
    );
    fireEvent.press(screen.getByText('Reschedule'));
    expect(defaultProps.onConfirm).toHaveBeenCalledWith('2h30m');
  });

  it('calls dismiss when Cancel is pressed', () => {
    const ref = createRef<BottomSheetRef>();
    render(<RescheduleSheet ref={ref} {...defaultProps} />);
    fireEvent.press(screen.getByText('Cancel'));
    expect(mockDismiss).toHaveBeenCalled();
  });

  it('shows "Rescheduling..." when isPending is true', () => {
    const ref = createRef<BottomSheetRef>();
    render(<RescheduleSheet ref={ref} {...defaultProps} isPending={true} />);
    expect(screen.getByText('Rescheduling...')).toBeTruthy();
  });

  it('renders help text for custom delay format', () => {
    const ref = createRef<BottomSheetRef>();
    render(<RescheduleSheet ref={ref} {...defaultProps} />);
    expect(screen.getByText('Use format like 15m, 1h, 6h, 1d, or 2h30m')).toBeTruthy();
  });
});
