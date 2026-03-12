import React from 'react';
import { render } from '@testing-library/react-native';
import { CancelConfirmSheet } from '@/components/runs/cancel-confirm-dialog';

// Mock the confirm-sheet component
jest.mock('@/components/shared/confirm-sheet', () => {
  const { View } = require('react-native');
  const React = require('react');
  const ConfirmSheet = React.forwardRef(
    (props: Record<string, unknown>, ref: React.Ref<unknown>) => {
      React.useImperativeHandle(ref, () => ({
        present: jest.fn(),
        dismiss: jest.fn(),
      }));
      return (
        <View
          testID="confirm-sheet"
          {...props}
        />
      );
    }
  );
  ConfirmSheet.displayName = 'ConfirmSheet';
  return { ConfirmSheet, ConfirmSheetRef: {} };
});

describe('CancelConfirmSheet', () => {
  const defaultProps = {
    onConfirm: jest.fn(),
    isPending: false,
  };

  it('renders the confirm sheet component', () => {
    const ref = React.createRef<any>();
    const { getByTestId } = render(
      <CancelConfirmSheet ref={ref} {...defaultProps} />
    );
    expect(getByTestId('confirm-sheet')).toBeTruthy();
  });

  it('passes correct props to ConfirmSheet', () => {
    const ref = React.createRef<any>();
    const { getByTestId } = render(
      <CancelConfirmSheet ref={ref} {...defaultProps} />
    );
    const sheet = getByTestId('confirm-sheet');
    expect(sheet.props.title).toBe('Cancel this run?');
    expect(sheet.props.confirmLabel).toBe('Cancel Run');
    expect(sheet.props.cancelLabel).toBe('Keep Running');
    expect(sheet.props.variant).toBe('destructive');
  });
});
