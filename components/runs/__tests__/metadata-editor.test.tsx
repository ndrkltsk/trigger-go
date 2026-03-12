import React, { createRef } from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { MetadataEditor } from '@/components/runs/metadata-editor';
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

describe('MetadataEditor', () => {
  const defaultMetadata = { foo: 'bar', count: 42 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dialog title', () => {
    const ref = createRef<BottomSheetRef>();
    const { getByText } = render(
      <MetadataEditor
        ref={ref}
        currentMetadata={defaultMetadata}
        onSave={jest.fn()}
        isPending={false}
      />
    );
    expect(getByText('Edit Metadata')).toBeTruthy();
  });

  it('calls onSave with parsed JSON when Save is pressed with valid JSON', async () => {
    const onSave = jest.fn();
    const ref = createRef<BottomSheetRef>();
    const { getByText } = render(
      <MetadataEditor
        ref={ref}
        currentMetadata={defaultMetadata}
        onSave={onSave}
        isPending={false}
      />
    );
    // Present to initialize the value — must await to flush state
    await act(async () => {
      await ref.current?.present();
    });
    fireEvent.press(getByText('Save'));
    expect(onSave).toHaveBeenCalledWith(defaultMetadata);
  });

  it('shows error when saving invalid JSON', async () => {
    const onSave = jest.fn();
    const ref = createRef<BottomSheetRef>();
    const { getByText, getByDisplayValue } = render(
      <MetadataEditor
        ref={ref}
        currentMetadata={defaultMetadata}
        onSave={onSave}
        isPending={false}
      />
    );
    await act(async () => {
      await ref.current?.present();
    });
    const input = getByDisplayValue(JSON.stringify(defaultMetadata, null, 2));
    fireEvent.changeText(input, '{invalid json');
    fireEvent.press(getByText('Save'));
    expect(onSave).not.toHaveBeenCalled();
    expect(getByText(/Invalid JSON/)).toBeTruthy();
  });

  it('shows error when metadata is not an object', async () => {
    const onSave = jest.fn();
    const ref = createRef<BottomSheetRef>();
    const { getByText, getByDisplayValue } = render(
      <MetadataEditor
        ref={ref}
        currentMetadata={defaultMetadata}
        onSave={onSave}
        isPending={false}
      />
    );
    await act(async () => {
      await ref.current?.present();
    });
    const input = getByDisplayValue(JSON.stringify(defaultMetadata, null, 2));
    fireEvent.changeText(input, '"just a string"');
    fireEvent.press(getByText('Save'));
    expect(onSave).not.toHaveBeenCalled();
    expect(getByText('Metadata must be a JSON object')).toBeTruthy();
  });

  it('calls dismiss when Cancel is pressed', () => {
    const ref = createRef<BottomSheetRef>();
    const { getByText } = render(
      <MetadataEditor
        ref={ref}
        currentMetadata={defaultMetadata}
        onSave={jest.fn()}
        isPending={false}
      />
    );
    fireEvent.press(getByText('Cancel'));
    expect(mockDismiss).toHaveBeenCalled();
  });

  it('shows "Saving..." when isPending', () => {
    const ref = createRef<BottomSheetRef>();
    const { getByText } = render(
      <MetadataEditor
        ref={ref}
        currentMetadata={defaultMetadata}
        onSave={jest.fn()}
        isPending={true}
      />
    );
    expect(getByText('Saving...')).toBeTruthy();
  });
});
