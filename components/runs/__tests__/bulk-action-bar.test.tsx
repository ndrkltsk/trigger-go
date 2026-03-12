import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BulkActionBar } from '@/components/runs/bulk-action-bar';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}));

describe('BulkActionBar', () => {
  const defaultProps = {
    selectedCount: 3,
    onCancelAll: jest.fn(),
    onReplayAll: jest.fn(),
    onDeselectAll: jest.fn(),
  };

  it('renders nothing when selectedCount is 0', () => {
    const { toJSON } = render(
      <BulkActionBar {...defaultProps} selectedCount={0} />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders selected count', () => {
    const { getByText } = render(<BulkActionBar {...defaultProps} />);
    expect(getByText('3 selected')).toBeTruthy();
  });

  it('renders Cancel All button', () => {
    const { getByText } = render(<BulkActionBar {...defaultProps} />);
    expect(getByText('Cancel All')).toBeTruthy();
  });

  it('renders Replay All button', () => {
    const { getByText } = render(<BulkActionBar {...defaultProps} />);
    expect(getByText('Replay All')).toBeTruthy();
  });

  it('renders Deselect All button', () => {
    const { getByText } = render(<BulkActionBar {...defaultProps} />);
    expect(getByText('Deselect All')).toBeTruthy();
  });

  it('calls onCancelAll when Cancel All button is pressed', () => {
    const onCancelAll = jest.fn();
    const { getByText } = render(
      <BulkActionBar {...defaultProps} onCancelAll={onCancelAll} />
    );
    fireEvent.press(getByText('Cancel All'));
    expect(onCancelAll).toHaveBeenCalledTimes(1);
  });

  it('calls onReplayAll when Replay All button is pressed', () => {
    const onReplayAll = jest.fn();
    const { getByText } = render(
      <BulkActionBar {...defaultProps} onReplayAll={onReplayAll} />
    );
    fireEvent.press(getByText('Replay All'));
    expect(onReplayAll).toHaveBeenCalledTimes(1);
  });

  it('calls onDeselectAll when Deselect All is pressed', () => {
    const onDeselectAll = jest.fn();
    const { getByText } = render(
      <BulkActionBar {...defaultProps} onDeselectAll={onDeselectAll} />
    );
    fireEvent.press(getByText('Deselect All'));
    expect(onDeselectAll).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when canceling', () => {
    const { getByText } = render(
      <BulkActionBar {...defaultProps} isCanceling />
    );
    expect(getByText('Canceling...')).toBeTruthy();
  });

  it('shows loading state when replaying', () => {
    const { getByText } = render(
      <BulkActionBar {...defaultProps} isReplaying />
    );
    expect(getByText('Replaying...')).toBeTruthy();
  });
});
