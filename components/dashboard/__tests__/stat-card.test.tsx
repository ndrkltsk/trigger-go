import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { StatCard, StatCardSkeleton } from '@/components/dashboard/stat-card';
import { Activity } from 'lucide-react-native';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const Icon = (props: any) => <View testID={`icon-${props.size}`} />;
  return {
    Activity: Icon,
    AlertTriangle: Icon,
    CheckCircle: Icon,
    Clock: Icon,
  };
});

describe('StatCard', () => {
  it('renders label and count', () => {
    render(
      <StatCard label="Running" count={5} color="#3B82F6" icon={Activity} />
    );
    expect(screen.getByText('Running')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(
      <StatCard label="Failed" count={3} color="#EF4444" icon={Activity} onPress={onPress} />
    );
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('displays zero count correctly', () => {
    render(
      <StatCard label="Queued" count={0} color="#8B95A5" icon={Activity} />
    );
    expect(screen.getByText('0')).toBeTruthy();
  });

  it('has accessible label', () => {
    render(
      <StatCard label="Completed" count={12} color="#22C55E" icon={Activity} />
    );
    expect(screen.getByLabelText('Completed: 12')).toBeTruthy();
  });
});

describe('StatCardSkeleton', () => {
  it('renders without error', () => {
    const { toJSON } = render(<StatCardSkeleton />);
    expect(toJSON()).toBeTruthy();
  });
});
