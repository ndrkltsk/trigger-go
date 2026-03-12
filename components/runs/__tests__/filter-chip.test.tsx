import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FilterChip } from '@/components/runs/filter-chip';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const MockIcon = (props: Record<string, unknown>) => <View testID="icon-chevron" {...props} />;
  MockIcon.displayName = 'ChevronDown';
  return { ChevronDown: MockIcon };
});

describe('FilterChip', () => {
  it('renders label when inactive', () => {
    const { getByText } = render(
      <FilterChip label="Status" isActive={false} onPress={() => {}} />
    );
    expect(getByText('Status')).toBeTruthy();
  });

  it('renders activeLabel when active', () => {
    const { getByText, queryByText } = render(
      <FilterChip
        label="Status"
        isActive={true}
        activeLabel="Failed, Queued"
        onPress={() => {}}
      />
    );
    expect(getByText('Failed, Queued')).toBeTruthy();
    expect(queryByText('Status')).toBeNull();
  });

  it('falls back to label when active but no activeLabel', () => {
    const { getByText } = render(
      <FilterChip label="Status" isActive={true} onPress={() => {}} />
    );
    expect(getByText('Status')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <FilterChip label="Status" isActive={false} onPress={onPress} />
    );
    fireEvent.press(getByText('Status'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
