import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ProfileCard } from '@/components/profiles/profile-card';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const Icon = () => <View testID="icon" />;
  return { Check: Icon, Trash2: Icon, Pencil: Icon };
});

jest.mock('@/services/auth/profiles', () => ({
  maskApiKey: (key: string) => `****${key.slice(-3)}`,
}));

describe('ProfileCard', () => {
  const defaultProps = {
    name: 'My Project',
    email: 'user@example.com',
    maskedKey: 'tr_pat_****xyz',
    isActive: false,
    onPress: jest.fn(),
    onDelete: jest.fn(),
    onRename: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders name and masked key', () => {
    render(<ProfileCard {...defaultProps} />);
    expect(screen.getByText('My Project')).toBeTruthy();
    expect(screen.getByText('tr_pat_****xyz')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    render(<ProfileCard {...defaultProps} />);
    fireEvent.press(screen.getByText('My Project'));
    expect(defaultProps.onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete is pressed', () => {
    render(<ProfileCard {...defaultProps} />);
    fireEvent.press(screen.getByLabelText('Delete My Project'));
    expect(defaultProps.onDelete).toHaveBeenCalledTimes(1);
  });

  it('calls onRename when rename is pressed', () => {
    render(<ProfileCard {...defaultProps} />);
    fireEvent.press(screen.getByLabelText('Rename My Project'));
    expect(defaultProps.onRename).toHaveBeenCalledTimes(1);
  });
});
