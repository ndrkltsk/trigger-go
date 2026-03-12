import React from 'react';
import { render } from '@testing-library/react-native';
import { ActionBar } from '@/components/runs/action-bar';
import { FilterChip } from '@/components/runs/filter-chip';
import { BulkActionBar } from '@/components/runs/bulk-action-bar';
import { EmptyState } from '@/components/shared/empty-state';
import { Inbox } from 'lucide-react-native';

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
    __esModule: true,
    MoreHorizontal: createMockIcon('MoreHorizontal'),
    Copy: createMockIcon('Copy'),
    RotateCcw: createMockIcon('RotateCcw'),
    Check: createMockIcon('Check'),
    ChevronDown: createMockIcon('ChevronDown'),
    Inbox: createMockIcon('Inbox'),
    SearchX: createMockIcon('SearchX'),
  };
});

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

describe('ActionBar accessibility', () => {
  const defaultProps = {
    onCancel: jest.fn(),
    isCanceling: false,
  };

  it('cancel button has descriptive label "Cancel run"', () => {
    const { getByLabelText } = render(
      <ActionBar {...defaultProps} status="EXECUTING" />
    );
    expect(getByLabelText('Cancel run')).toBeTruthy();
  });

  it('replay button has descriptive label "Replay run"', () => {
    const { getByLabelText } = render(
      <ActionBar {...defaultProps} status="COMPLETED" />
    );
    expect(getByLabelText('Replay run')).toBeTruthy();
  });

  it('cancel button label updates when canceling', () => {
    const { getByLabelText } = render(
      <ActionBar {...defaultProps} status="EXECUTING" isCanceling />
    );
    expect(getByLabelText('Canceling run')).toBeTruthy();
  });

  it('replay button label updates when replaying', () => {
    const { getByLabelText } = render(
      <ActionBar {...defaultProps} status="COMPLETED" isReplaying />
    );
    expect(getByLabelText('Replaying run')).toBeTruthy();
  });
});

describe('FilterChip accessibility', () => {
  it('has button accessibility role', () => {
    const { getByRole } = render(
      <FilterChip label="Status" isActive={false} onPress={jest.fn()} />
    );
    expect(getByRole('button')).toBeTruthy();
  });

  it('has descriptive accessibility label when inactive', () => {
    const { getByLabelText } = render(
      <FilterChip label="Status" isActive={false} onPress={jest.fn()} />
    );
    expect(getByLabelText('Status filter')).toBeTruthy();
  });

  it('has descriptive accessibility label when active', () => {
    const { getByLabelText } = render(
      <FilterChip label="Status" isActive={true} activeLabel="Failed, Crashed" onPress={jest.fn()} />
    );
    expect(getByLabelText('Status filter: Failed, Crashed')).toBeTruthy();
  });

  it('has accessibility hint', () => {
    const { getByHintText } = render(
      <FilterChip label="Status" isActive={false} onPress={jest.fn()} />
    );
    expect(getByHintText(/open status filter options/i)).toBeTruthy();
  });
});

describe('BulkActionBar accessibility', () => {
  it('cancel all button has count in label', () => {
    const { getByLabelText } = render(
      <BulkActionBar
        selectedCount={3}
        onCancelAll={jest.fn()}
        onReplayAll={jest.fn()}
        onDeselectAll={jest.fn()}
      />
    );
    expect(getByLabelText('Cancel 3 selected runs')).toBeTruthy();
  });

  it('replay all button has count in label', () => {
    const { getByLabelText } = render(
      <BulkActionBar
        selectedCount={5}
        onCancelAll={jest.fn()}
        onReplayAll={jest.fn()}
        onDeselectAll={jest.fn()}
      />
    );
    expect(getByLabelText('Replay 5 selected runs')).toBeTruthy();
  });

  it('deselect all button has accessible label', () => {
    const { getByLabelText } = render(
      <BulkActionBar
        selectedCount={2}
        onCancelAll={jest.fn()}
        onReplayAll={jest.fn()}
        onDeselectAll={jest.fn()}
      />
    );
    expect(getByLabelText('Deselect all runs')).toBeTruthy();
  });
});

describe('EmptyState accessibility', () => {
  it('has combined accessibility label with title and description', () => {
    const { getByLabelText } = render(
      <EmptyState icon={Inbox} title="No runs" description="Nothing here" />
    );
    expect(getByLabelText(/No runs.*Nothing here/)).toBeTruthy();
  });

  it('title has header accessibility role', () => {
    const { getByText } = render(
      <EmptyState icon={Inbox} title="No runs" description="Nothing here" />
    );
    const titleElement = getByText('No runs');
    expect(
      titleElement.props.accessibilityRole === 'header' || titleElement.props.role === 'heading'
    ).toBe(true);
  });

  it('decorative icon is hidden from accessibility', () => {
    const { getByTestId } = render(
      <EmptyState icon={Inbox} title="No runs" description="Nothing here" />
    );
    const icon = getByTestId('icon-Inbox');
    expect(icon.props.importantForAccessibility).toBe('no');
  });

  it('action button has accessibility label', () => {
    const { getByLabelText } = render(
      <EmptyState
        icon={Inbox}
        title="No runs"
        description="Nothing here"
        actionLabel="Create run"
        onAction={jest.fn()}
      />
    );
    expect(getByLabelText('Create run')).toBeTruthy();
  });
});
