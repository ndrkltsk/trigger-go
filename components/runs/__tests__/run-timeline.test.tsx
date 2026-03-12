import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { RunTimeline } from '../run-timeline';

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const mockIcon = (name: string) => {
    const MockIcon = (props: any) => <View testID={`icon-${name}`} {...props} />;
    MockIcon.displayName = name;
    return MockIcon;
  };
  return {
    Clock: mockIcon('Clock'),
  };
});

// Mock nativewind
jest.mock('nativewind', () => ({
  cssInterop: jest.fn(),
}));

describe('RunTimeline (deprecated)', () => {
  it('shows default message', () => {
    render(<RunTimeline />);
    expect(
      screen.getByText('Use the Attempts tab to view attempt details.')
    ).toBeTruthy();
  });

  it('shows custom message when provided', () => {
    render(<RunTimeline message="Custom message" />);
    expect(screen.getByText('Custom message')).toBeTruthy();
  });
});
