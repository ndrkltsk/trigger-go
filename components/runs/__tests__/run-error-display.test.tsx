import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RunErrorDisplay } from '@/components/runs/run-error-display';
import type { SerializedError } from '@/services/api/runs';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const createMockIcon = (name: string) => {
    const MockIcon = (props: Record<string, unknown>) => <View testID={`icon-${name}`} {...props} />;
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    ChevronDown: createMockIcon('ChevronDown'),
    ChevronRight: createMockIcon('ChevronRight'),
    Copy: createMockIcon('Copy'),
    Check: createMockIcon('Check'),
  };
});

jest.mock('@/components/ui/collapsible', () => {
  const { View, Pressable } = require('react-native');
  return {
    Collapsible: ({ children, ...props }: { children: React.ReactNode }) => (
      <View testID="collapsible" {...props}>{children}</View>
    ),
    CollapsibleTrigger: ({ children, ...props }: { children: React.ReactNode }) => (
      <Pressable testID="collapsible-trigger" {...props}>{children}</Pressable>
    ),
    CollapsibleContent: ({ children }: { children: React.ReactNode }) => (
      <View testID="collapsible-content">{children}</View>
    ),
  };
});

describe('RunErrorDisplay', () => {
  it('renders nothing when error is null', () => {
    const { toJSON } = render(<RunErrorDisplay error={null} />);
    expect(toJSON()).toBeNull();
  });

  it('renders nothing when error is undefined', () => {
    const { toJSON } = render(<RunErrorDisplay error={undefined} />);
    expect(toJSON()).toBeNull();
  });

  it('renders error message', () => {
    const error: SerializedError = {
      message: 'Something went wrong',
      name: 'TypeError',
    };
    const { getByText } = render(<RunErrorDisplay error={error} />);
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('renders error name when present', () => {
    const error: SerializedError = {
      message: 'Something went wrong',
      name: 'TypeError',
    };
    const { getByText } = render(<RunErrorDisplay error={error} />);
    expect(getByText('TypeError')).toBeTruthy();
  });

  it('renders without name when not present', () => {
    const error: SerializedError = {
      message: 'Something went wrong',
    };
    const { getByText, queryByText } = render(<RunErrorDisplay error={error} />);
    expect(getByText('Something went wrong')).toBeTruthy();
    expect(queryByText('TypeError')).toBeNull();
  });

  it('renders stack trace section when present', () => {
    const error: SerializedError = {
      message: 'Error occurred',
      stackTrace: 'at line 1\nat line 2',
    };
    const { getByText } = render(<RunErrorDisplay error={error} />);
    expect(getByText('Stack trace')).toBeTruthy();
    expect(getByText('at line 1\nat line 2')).toBeTruthy();
  });

  it('does not render stack trace when not present', () => {
    const error: SerializedError = {
      message: 'Error occurred',
    };
    const { queryByText } = render(<RunErrorDisplay error={error} />);
    expect(queryByText('Stack trace')).toBeNull();
  });

  it('copies error message on copy press', () => {
    const Clipboard = require('expo-clipboard');
    const error: SerializedError = {
      message: 'Something went wrong',
    };
    const { getByTestId } = render(<RunErrorDisplay error={error} />);
    fireEvent.press(getByTestId('icon-Copy'));
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('Something went wrong');
  });
});
