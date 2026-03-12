import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { JsonViewer } from '@/components/shared/json-viewer';

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

describe('JsonViewer', () => {
  it('renders null data with "No data" message', () => {
    const { getByText } = render(<JsonViewer data={null} title="Test" />);
    expect(getByText('No data')).toBeTruthy();
  });

  it('renders undefined data with "No data" message', () => {
    const { getByText } = render(<JsonViewer data={undefined} title="Test" />);
    expect(getByText('No data')).toBeTruthy();
  });

  it('renders title when provided', () => {
    const { getByText } = render(<JsonViewer data={{ key: 'value' }} title="Payload" />);
    expect(getByText('Payload')).toBeTruthy();
  });

  it('copies JSON to clipboard on copy press', async () => {
    const Clipboard = require('expo-clipboard');
    const data = { key: 'value' };
    const { getByTestId } = render(<JsonViewer data={data} />);

    const copyIcon = getByTestId('icon-Copy');
    fireEvent.press(copyIcon);

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
  });

  it('renders leaf string values with quotes', () => {
    const data = { name: 'alice' };
    const { getByText } = render(<JsonViewer data={data} />);
    expect(getByText('"alice"')).toBeTruthy();
  });

  it('renders leaf number values', () => {
    const data = { count: 42 };
    const { getByText } = render(<JsonViewer data={data} />);
    expect(getByText('42')).toBeTruthy();
  });

  it('renders null leaf values', () => {
    const data = { empty: null };
    const { getByText } = render(<JsonViewer data={data} />);
    expect(getByText('null')).toBeTruthy();
  });

  it('renders boolean leaf values', () => {
    const data = { active: true };
    const { getByText } = render(<JsonViewer data={data} />);
    expect(getByText('true')).toBeTruthy();
  });

  it('renders key names for object entries', () => {
    const data = { foo: 'bar' };
    const { getByText } = render(<JsonViewer data={data} />);
    // Key name and value are separate Text elements
    expect(getByText('"foo": ')).toBeTruthy();
    expect(getByText('"bar"')).toBeTruthy();
  });

  it('renders array index labels', () => {
    const data = ['a', 'b', 'c'];
    const { getByText } = render(<JsonViewer data={data} />);
    expect(getByText('0: ')).toBeTruthy();
    expect(getByText('"a"')).toBeTruthy();
  });

  it('shows summary for collapsed nested objects', () => {
    const data = { nested: { a: 1, b: 2 } };
    const { getByText } = render(<JsonViewer data={data} />);
    // The nested object should show a summary like {2} when collapsed
    expect(getByText('{2}')).toBeTruthy();
  });

  it('shows summary for collapsed arrays', () => {
    const data = { items: [1, 2, 3] };
    const { getByText } = render(<JsonViewer data={data} />);
    expect(getByText('Array(3)')).toBeTruthy();
  });

  it('expands nested object on press', () => {
    const data = { nested: { a: 1 } };
    const { getByText, queryByText } = render(<JsonViewer data={data} />);
    // Initially collapsed - shows summary
    expect(getByText('{1}')).toBeTruthy();
    expect(queryByText('1')).toBeNull();

    // Press the nested key row to expand it
    fireEvent.press(getByText('"nested": '));
    expect(getByText('1')).toBeTruthy();
  });

  it('shows "Show N more..." for large arrays', () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    const data = { bigArray: items };
    const { getByText } = render(<JsonViewer data={data} />);

    // First expand the bigArray node
    fireEvent.press(getByText('"bigArray": '));

    // Should show "Show 15 more..."
    expect(getByText('Show 15 more...')).toBeTruthy();
  });

  it('reveals all items when "Show N more..." is pressed', () => {
    const items = Array.from({ length: 25 }, (_, i) => `item-${i}`);
    const data = { bigArray: items };
    const { getByText, queryByText } = render(<JsonViewer data={data} />);

    // Expand the bigArray node
    fireEvent.press(getByText('"bigArray": '));

    // Item 24 should not be visible initially
    expect(queryByText('"item-24"')).toBeNull();

    // Press "Show more"
    fireEvent.press(getByText('Show 15 more...'));

    // Now item 24 should be visible
    expect(getByText('"item-24"')).toBeTruthy();
  });
});
