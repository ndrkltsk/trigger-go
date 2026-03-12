import React from 'react';
import { render } from '@testing-library/react-native';
import { RunProgressBar } from '@/components/runs/run-progress-bar';

jest.mock('@rn-primitives/progress', () => {
  const { View } = require('react-native');
  return {
    Root: (props: Record<string, unknown>) => <View testID="progress-root" {...props} />,
    Indicator: ({ children, ...props }: { children?: React.ReactNode }) => (
      <View testID="progress-indicator" {...props}>{children}</View>
    ),
  };
});

describe('RunProgressBar', () => {
  it('renders nothing when metadata is null', () => {
    const { toJSON } = render(<RunProgressBar metadata={null} />);
    expect(toJSON()).toBeNull();
  });

  it('renders nothing when metadata has no progress key', () => {
    const { toJSON } = render(<RunProgressBar metadata={{ foo: 'bar' }} />);
    expect(toJSON()).toBeNull();
  });

  it('renders nothing when progress is not a number', () => {
    const { toJSON } = render(<RunProgressBar metadata={{ progress: 'half' }} />);
    expect(toJSON()).toBeNull();
  });

  // 0-1 float progress (existing behavior)
  it('renders progress bar when progress is a 0-1 float', () => {
    const { getByText } = render(<RunProgressBar metadata={{ progress: 0.5 }} />);
    expect(getByText('50%')).toBeTruthy();
  });

  it('displays 0% for progress value of 0', () => {
    const { getByText } = render(<RunProgressBar metadata={{ progress: 0 }} />);
    expect(getByText('0%')).toBeTruthy();
  });

  it('displays 100% for progress value of 1', () => {
    const { getByText } = render(<RunProgressBar metadata={{ progress: 1 }} />);
    expect(getByText('100%')).toBeTruthy();
  });

  it('clamps values above 1 to 100%', () => {
    const { getByText } = render(<RunProgressBar metadata={{ progress: 1.5 }} />);
    expect(getByText('100%')).toBeTruthy();
  });

  it('clamps negative values to 0%', () => {
    const { getByText } = render(<RunProgressBar metadata={{ progress: -0.5 }} />);
    expect(getByText('0%')).toBeTruthy();
  });

  // 0-100 integer progress
  it('normalizes 0-100 integer progress to percentage', () => {
    const { getByText } = render(<RunProgressBar metadata={{ progress: 75 }} />);
    expect(getByText('75%')).toBeTruthy();
  });

  it('handles progress of exactly 100', () => {
    const { getByText } = render(<RunProgressBar metadata={{ progress: 100 }} />);
    expect(getByText('100%')).toBeTruthy();
  });

  // progressPercent alias
  it('detects progressPercent as alias', () => {
    const { getByText } = render(<RunProgressBar metadata={{ progressPercent: 0.3 }} />);
    expect(getByText('30%')).toBeTruthy();
  });

  // percent alias
  it('detects percent as alias', () => {
    const { getByText } = render(<RunProgressBar metadata={{ percent: 60 }} />);
    expect(getByText('60%')).toBeTruthy();
  });

  // step/totalSteps
  it('computes progress from step and totalSteps', () => {
    const { getByText } = render(
      <RunProgressBar metadata={{ step: 3, totalSteps: 10 }} />
    );
    expect(getByText('30%')).toBeTruthy();
    expect(getByText('Step 3 of 10')).toBeTruthy();
  });

  it('shows step info text alongside percentage', () => {
    const { getByText } = render(
      <RunProgressBar metadata={{ step: 7, totalSteps: 14 }} />
    );
    expect(getByText('50%')).toBeTruthy();
    expect(getByText('Step 7 of 14')).toBeTruthy();
  });

  it('prefers explicit progress over step/totalSteps for value', () => {
    const { getByText } = render(
      <RunProgressBar metadata={{ progress: 0.9, step: 3, totalSteps: 10 }} />
    );
    // progress: 0.9 should override step-based 0.3
    expect(getByText('90%')).toBeTruthy();
    // But step info is still shown
    expect(getByText('Step 3 of 10')).toBeTruthy();
  });

  it('ignores step/totalSteps when totalSteps is 0', () => {
    const { toJSON } = render(
      <RunProgressBar metadata={{ step: 3, totalSteps: 0 }} />
    );
    expect(toJSON()).toBeNull();
  });

  it('ignores step/totalSteps when step is not a number', () => {
    const { toJSON } = render(
      <RunProgressBar metadata={{ step: 'three', totalSteps: 10 }} />
    );
    expect(toJSON()).toBeNull();
  });
});
