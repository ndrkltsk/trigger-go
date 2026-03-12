import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TriggerPayloadEditor } from '@/components/tasks/trigger-payload-editor';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const createMockIcon = (name: string) => {
    const MockIcon = (props: Record<string, unknown>) => <View testID={`icon-${name}`} {...props} />;
    MockIcon.displayName = name;
    return MockIcon;
  };
  return {
    X: createMockIcon('X'),
  };
});

describe('TriggerPayloadEditor', () => {
  it('renders with placeholder text', () => {
    const { getByPlaceholderText } = render(
      <TriggerPayloadEditor value="" onChange={jest.fn()} />
    );
    expect(getByPlaceholderText('{ "key": "value" }')).toBeTruthy();
  });

  it('calls onChange when text is entered', () => {
    const onChange = jest.fn();
    const { getByPlaceholderText } = render(
      <TriggerPayloadEditor value="" onChange={onChange} />
    );
    fireEvent.changeText(getByPlaceholderText('{ "key": "value" }'), '{"test": 1}');
    expect(onChange).toHaveBeenCalledWith('{"test": 1}');
  });

  it('shows external error prop', () => {
    const { getByText } = render(
      <TriggerPayloadEditor value="bad json" onChange={jest.fn()} error="Custom error" />
    );
    expect(getByText('Custom error')).toBeTruthy();
  });

  it('validates JSON on blur and shows error for invalid JSON', async () => {
    const { getByPlaceholderText, findByText } = render(
      <TriggerPayloadEditor value="{bad" onChange={jest.fn()} />
    );
    fireEvent(getByPlaceholderText('{ "key": "value" }'), 'blur');
    const errorText = await findByText(/Invalid JSON/);
    expect(errorText).toBeTruthy();
  });

  it('does not show error for valid JSON on blur', () => {
    const { getByPlaceholderText, queryByText } = render(
      <TriggerPayloadEditor value='{"valid": true}' onChange={jest.fn()} />
    );
    fireEvent(getByPlaceholderText('{ "key": "value" }'), 'blur');
    expect(queryByText(/Invalid JSON/)).toBeNull();
  });

  it('does not show error for empty value on blur', () => {
    const { getByPlaceholderText, queryByText } = render(
      <TriggerPayloadEditor value="" onChange={jest.fn()} />
    );
    fireEvent(getByPlaceholderText('{ "key": "value" }'), 'blur');
    expect(queryByText(/Invalid JSON/)).toBeNull();
  });

  it('shows clear button when value is not empty', () => {
    const { getByText } = render(
      <TriggerPayloadEditor value='{"key": "value"}' onChange={jest.fn()} />
    );
    expect(getByText('Clear')).toBeTruthy();
  });

  it('does not show clear button when value is empty', () => {
    const { queryByText } = render(
      <TriggerPayloadEditor value="" onChange={jest.fn()} />
    );
    expect(queryByText('Clear')).toBeNull();
  });

  it('calls onChange with empty string when clear is pressed', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <TriggerPayloadEditor value='{"key": "value"}' onChange={onChange} />
    );
    fireEvent.press(getByText('Clear'));
    expect(onChange).toHaveBeenCalledWith('');
  });
});
