import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EnvVarRow } from '@/components/settings/env-var-row';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const createMockIcon = (name: string) => {
    const MockIcon = (props: Record<string, unknown>) => <View testID={`icon-${name}`} {...props} />;
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    Eye: createMockIcon('Eye'),
    EyeOff: createMockIcon('EyeOff'),
    MoreVertical: createMockIcon('MoreVertical'),
    Pencil: createMockIcon('Pencil'),
    Trash2: createMockIcon('Trash2'),
  };
});

jest.mock('@/components/ui/dropdown-menu', () => {
  const { View, Pressable, Text } = require('react-native');
  return {
    DropdownMenu: ({ children }: { children: React.ReactNode }) => (
      <View testID="dropdown-menu">{children}</View>
    ),
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
      <View testID="dropdown-trigger">{children}</View>
    ),
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
      <View testID="dropdown-content">{children}</View>
    ),
    DropdownMenuItem: ({
      children,
      onPress,
    }: {
      children: React.ReactNode;
      onPress?: () => void;
    }) => (
      <Pressable testID="dropdown-item" onPress={onPress}>
        {children}
      </Pressable>
    ),
  };
});

describe('EnvVarRow', () => {
  const envVar = { name: 'API_KEY', value: 'secret_value_123' };

  it('displays the variable name', () => {
    const { getByText } = render(
      <EnvVarRow envVar={envVar} onEdit={jest.fn()} onDelete={jest.fn()} />
    );
    expect(getByText('API_KEY')).toBeTruthy();
  });

  it('masks the value by default', () => {
    const { queryByText } = render(
      <EnvVarRow envVar={envVar} onEdit={jest.fn()} onDelete={jest.fn()} />
    );
    expect(queryByText('secret_value_123')).toBeNull();
    expect(queryByText('\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022')).toBeTruthy();
  });

  it('reveals the value when eye icon is pressed', () => {
    const { getByTestId, getByText } = render(
      <EnvVarRow envVar={envVar} onEdit={jest.fn()} onDelete={jest.fn()} />
    );
    fireEvent.press(getByTestId('icon-Eye'));
    expect(getByText('secret_value_123')).toBeTruthy();
  });

  it('hides the value again when eye-off icon is pressed', () => {
    const { getByTestId, queryByText } = render(
      <EnvVarRow envVar={envVar} onEdit={jest.fn()} onDelete={jest.fn()} />
    );
    // Reveal
    fireEvent.press(getByTestId('icon-Eye'));
    // Hide
    fireEvent.press(getByTestId('icon-EyeOff'));
    expect(queryByText('secret_value_123')).toBeNull();
  });

  it('renders dropdown menu actions', () => {
    const { getByText } = render(
      <EnvVarRow envVar={envVar} onEdit={jest.fn()} onDelete={jest.fn()} />
    );
    expect(getByText('Edit')).toBeTruthy();
    expect(getByText('Delete')).toBeTruthy();
  });
});
