import React, { createRef } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StatusFilterSheet } from '@/components/runs/status-filter-sheet';
import type { BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const createMockIcon = (name: string) => {
    const MockIcon = (props: Record<string, unknown>) => <View testID={`icon-${name}`} {...props} />;
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    X: createMockIcon('X'),
    Check: createMockIcon('Check'),
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

describe('StatusFilterSheet', () => {
  it('renders all status options', () => {
    const ref = createRef<BottomSheetRef>();
    const { getByText } = render(
      <StatusFilterSheet
        ref={ref}
        selected={[]}
        onApply={() => {}}
      />
    );
    expect(getByText('Completed')).toBeTruthy();
    expect(getByText('Failed')).toBeTruthy();
    expect(getByText('Running')).toBeTruthy();
    expect(getByText('Queued')).toBeTruthy();
  });

  it('calls onApply with selected statuses', () => {
    const onApply = jest.fn();
    const ref = createRef<BottomSheetRef>();
    const { getByText } = render(
      <StatusFilterSheet
        ref={ref}
        selected={['FAILED']}
        onApply={onApply}
      />
    );

    fireEvent.press(getByText('Apply'));
    expect(onApply).toHaveBeenCalledWith(['FAILED']);
    expect(mockDismiss).toHaveBeenCalled();
  });

  it('calls dismiss on cancel', () => {
    const ref = createRef<BottomSheetRef>();
    const { getByText } = render(
      <StatusFilterSheet
        ref={ref}
        selected={[]}
        onApply={() => {}}
      />
    );

    fireEvent.press(getByText('Cancel'));
    expect(mockDismiss).toHaveBeenCalled();
  });
});
