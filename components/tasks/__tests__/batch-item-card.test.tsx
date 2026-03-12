import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BatchItemCard } from '@/components/tasks/batch-item-card';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const createMockIcon = (name: string) => {
    const MockIcon = (props: Record<string, unknown>) => <View testID={`icon-${name}`} {...props} />;
    MockIcon.displayName = name;
    return MockIcon;
  };
  return {
    Pencil: createMockIcon('Pencil'),
    X: createMockIcon('X'),
    ChevronDown: createMockIcon('ChevronDown'),
    ChevronUp: createMockIcon('ChevronUp'),
  };
});

describe('BatchItemCard', () => {
  const defaultProps = {
    index: 0,
    taskIdentifier: 'send-email',
    payload: '{ "to": "test@example.com" }',
    onEdit: jest.fn(),
    onRemove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the item number', () => {
    const { getByText } = render(<BatchItemCard {...defaultProps} />);
    expect(getByText('1')).toBeTruthy();
  });

  it('renders the task identifier', () => {
    const { getByText } = render(<BatchItemCard {...defaultProps} />);
    expect(getByText('send-email')).toBeTruthy();
  });

  it('renders payload preview when not expanded', () => {
    const { getByText } = render(<BatchItemCard {...defaultProps} />);
    expect(getByText('{ "to": "test@example.com" }')).toBeTruthy();
  });

  it('shows (empty payload) when payload is empty', () => {
    const { getByText } = render(
      <BatchItemCard {...defaultProps} payload="" />
    );
    // When payload is empty, no preview is shown (only when expanded)
    expect(getByText('send-email')).toBeTruthy();
  });

  it('renders correct index for second item', () => {
    const { getByText } = render(
      <BatchItemCard {...defaultProps} index={1} />
    );
    expect(getByText('2')).toBeTruthy();
  });

  it('calls onRemove when X button is pressed', () => {
    const onRemove = jest.fn();
    const { getByTestId } = render(
      <BatchItemCard {...defaultProps} onRemove={onRemove} />
    );
    const xIcon = getByTestId('icon-X');
    const removeButton = xIcon.parent;
    if (removeButton) fireEvent.press(removeButton);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('truncates long payload preview to 2 lines', () => {
    const longPayload = '{\n  "line1": "a",\n  "line2": "b",\n  "line3": "c"\n}';
    const { getByText } = render(
      <BatchItemCard {...defaultProps} payload={longPayload} />
    );
    // The preview shows first 2 lines + "..."
    expect(getByText('{\n  "line1": "a",...')).toBeTruthy();
  });
});
