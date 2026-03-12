import React from 'react';
import { render } from '@testing-library/react-native';
import { RunCard } from '@/components/runs/run-card';
import type { ListRunItem } from '@/services/api/runs';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy({}, {
    get: (_target: Record<string, unknown>, name: string) => {
      const Icon = (props: Record<string, unknown>) => <View testID={`icon-${name}`} {...props} />;
      Icon.displayName = name;
      return Icon;
    },
  });
});

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    useAnimatedStyle: () => ({}),
    useSharedValue: (v: number) => ({ value: v }),
    withTiming: (v: number) => v,
    withRepeat: (v: number) => v,
    cancelAnimation: () => {},
    useReducedMotion: () => false,
    Easing: { inOut: () => {}, ease: {} },
  };
});

const mockRun: ListRunItem = {
  id: 'run_abc123',
  taskIdentifier: 'send-email',
  status: 'COMPLETED',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  env: { id: 'env_1', name: 'prod' },
  isTest: false,
  tags: ['user_1', 'org_2'],
};

describe('RunCard accessibility', () => {
  it('has an accessibility role of button', () => {
    const { getByRole } = render(
      <RunCard run={mockRun} onPress={jest.fn()} />
    );
    expect(getByRole('button')).toBeTruthy();
  });

  it('accessibility label contains run ID', () => {
    const { getByLabelText } = render(
      <RunCard run={mockRun} onPress={jest.fn()} />
    );
    expect(getByLabelText(/run_abc123/)).toBeTruthy();
  });

  it('accessibility label contains task identifier', () => {
    const { getByLabelText } = render(
      <RunCard run={mockRun} onPress={jest.fn()} />
    );
    expect(getByLabelText(/send-email/)).toBeTruthy();
  });

  it('accessibility label contains status text', () => {
    const { getAllByLabelText } = render(
      <RunCard run={mockRun} onPress={jest.fn()} />
    );
    const matches = getAllByLabelText(/Completed/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('has accessibilityHint for view details', () => {
    const { getByHintText } = render(
      <RunCard run={mockRun} onPress={jest.fn()} />
    );
    expect(getByHintText(/view run details/i)).toBeTruthy();
  });

  it('has select mode hint when in select mode', () => {
    const { getByHintText } = render(
      <RunCard run={mockRun} isSelectMode onToggleSelect={jest.fn()} />
    );
    expect(getByHintText(/toggle selection/i)).toBeTruthy();
  });

  it('status badge has accessibility label', () => {
    const { getByLabelText } = render(
      <RunCard run={mockRun} onPress={jest.fn()} />
    );
    expect(getByLabelText(/Status: Completed/i)).toBeTruthy();
  });

  it('failed run has correct status in label', () => {
    const failedRun: ListRunItem = { ...mockRun, status: 'FAILED' };
    const { getByLabelText } = render(
      <RunCard run={failedRun} onPress={jest.fn()} />
    );
    expect(getByLabelText(/status Failed/i)).toBeTruthy();
  });
});
