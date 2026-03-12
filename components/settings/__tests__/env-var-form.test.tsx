import React, { createRef } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EnvVarForm } from '@/components/settings/env-var-form';
import type { BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';

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

describe('EnvVarForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "Create Variable" title in create mode', () => {
    const ref = createRef<BottomSheetRef>();
    const { getByText } = render(
      <EnvVarForm
        ref={ref}
        mode="create"
        onSubmit={jest.fn()}
        isPending={false}
      />
    );
    expect(getByText('Create Variable')).toBeTruthy();
    expect(getByText('Create')).toBeTruthy();
  });

  it('renders "Edit Variable" title in edit mode', () => {
    const ref = createRef<BottomSheetRef>();
    const { getByText } = render(
      <EnvVarForm
        ref={ref}
        mode="edit"
        initialName="MY_VAR"
        initialValue="old_value"
        onSubmit={jest.fn()}
        isPending={false}
      />
    );
    expect(getByText('Edit Variable')).toBeTruthy();
    expect(getByText('Save')).toBeTruthy();
  });

  it('shows validation error for empty name', () => {
    const onSubmit = jest.fn();
    const ref = createRef<BottomSheetRef>();
    const { getByText } = render(
      <EnvVarForm
        ref={ref}
        mode="create"
        onSubmit={onSubmit}
        isPending={false}
      />
    );
    fireEvent.press(getByText('Create'));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(getByText('Name is required')).toBeTruthy();
  });

  it('shows validation error for invalid name', () => {
    const onSubmit = jest.fn();
    const ref = createRef<BottomSheetRef>();
    const { getByText, getByPlaceholderText } = render(
      <EnvVarForm
        ref={ref}
        mode="create"
        onSubmit={onSubmit}
        isPending={false}
      />
    );
    fireEvent.changeText(getByPlaceholderText('VARIABLE_NAME'), 'invalid name!');
    fireEvent.press(getByText('Create'));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(getByText(/must start with a letter/)).toBeTruthy();
  });

  it('calls onSubmit with name and value for valid input', () => {
    const onSubmit = jest.fn();
    const ref = createRef<BottomSheetRef>();
    const { getByText, getByPlaceholderText } = render(
      <EnvVarForm
        ref={ref}
        mode="create"
        onSubmit={onSubmit}
        isPending={false}
      />
    );
    fireEvent.changeText(getByPlaceholderText('VARIABLE_NAME'), 'NEW_KEY');
    fireEvent.changeText(getByPlaceholderText('Enter value...'), 'new_value');
    fireEvent.press(getByText('Create'));
    expect(onSubmit).toHaveBeenCalledWith('NEW_KEY', 'new_value');
  });

  it('shows "Creating..." when isPending in create mode', () => {
    const ref = createRef<BottomSheetRef>();
    const { getByText } = render(
      <EnvVarForm
        ref={ref}
        mode="create"
        onSubmit={jest.fn()}
        isPending={true}
      />
    );
    expect(getByText('Creating...')).toBeTruthy();
  });

  it('shows "Saving..." when isPending in edit mode', () => {
    const ref = createRef<BottomSheetRef>();
    const { getByText } = render(
      <EnvVarForm
        ref={ref}
        mode="edit"
        initialName="KEY"
        onSubmit={jest.fn()}
        isPending={true}
      />
    );
    expect(getByText('Saving...')).toBeTruthy();
  });

  it('calls dismiss when Cancel is pressed', () => {
    const ref = createRef<BottomSheetRef>();
    const { getByText } = render(
      <EnvVarForm
        ref={ref}
        mode="create"
        onSubmit={jest.fn()}
        isPending={false}
      />
    );
    fireEvent.press(getByText('Cancel'));
    expect(mockDismiss).toHaveBeenCalled();
  });

  it('displays API error when provided', () => {
    const ref = createRef<BottomSheetRef>();
    const { getByText } = render(
      <EnvVarForm
        ref={ref}
        mode="create"
        onSubmit={jest.fn()}
        isPending={false}
        error="Variable already exists"
      />
    );
    expect(getByText('Variable already exists')).toBeTruthy();
  });
});
