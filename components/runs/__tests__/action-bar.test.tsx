import React from 'react';
import { render } from '@testing-library/react-native';
import { ActionBar } from '@/components/runs/action-bar';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const createMockIcon = (name: string) => {
    const MockIcon = (props: Record<string, unknown>) => <View testID={`icon-${name}`} {...props} />;
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    MoreHorizontal: createMockIcon('MoreHorizontal'),
    Copy: createMockIcon('Copy'),
    RotateCcw: createMockIcon('RotateCcw'),
    Check: createMockIcon('Check'),
  };
});

// Mock the entire dropdown-menu UI component to avoid NativeOnlyAnimatedView issues
jest.mock('@/components/ui/dropdown-menu', () => {
  const { View, Pressable } = require('react-native');
  return {
    DropdownMenu: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => children,
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    DropdownMenuItem: ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) => (
      <Pressable onPress={onPress}>{children}</Pressable>
    ),
  };
});

describe('ActionBar', () => {
  const defaultProps = {
    onCancel: jest.fn(),
    isCanceling: false,
  };

  it('shows Cancel button for active (non-terminal) run', () => {
    const { getByText } = render(
      <ActionBar {...defaultProps} status="EXECUTING" />
    );
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('shows Replay button for terminal run', () => {
    const { getByText } = render(
      <ActionBar {...defaultProps} status="COMPLETED" />
    );
    expect(getByText('Replay')).toBeTruthy();
  });

  it('does not show Cancel for completed run', () => {
    const { queryByText } = render(
      <ActionBar {...defaultProps} status="COMPLETED" />
    );
    expect(queryByText('Cancel')).toBeNull();
  });

  it('does not show Replay for executing run', () => {
    const { queryByText } = render(
      <ActionBar {...defaultProps} status="EXECUTING" />
    );
    expect(queryByText('Replay')).toBeNull();
  });

  it('shows "Canceling..." when isCanceling is true', () => {
    const { getByText } = render(
      <ActionBar {...defaultProps} status="EXECUTING" isCanceling={true} />
    );
    expect(getByText('Canceling...')).toBeTruthy();
  });

  it('shows "Replaying..." when isReplaying is true', () => {
    const { getByText } = render(
      <ActionBar {...defaultProps} status="COMPLETED" isReplaying={true} />
    );
    expect(getByText('Replaying...')).toBeTruthy();
  });

  it('shows Cancel for QUEUED status', () => {
    const { getByText } = render(
      <ActionBar {...defaultProps} status="QUEUED" />
    );
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('shows Replay for FAILED status', () => {
    const { getByText } = render(
      <ActionBar {...defaultProps} status="FAILED" />
    );
    expect(getByText('Replay')).toBeTruthy();
  });

  it('shows Replay for CANCELED status', () => {
    const { getByText } = render(
      <ActionBar {...defaultProps} status="CANCELED" />
    );
    expect(getByText('Replay')).toBeTruthy();
  });
});
