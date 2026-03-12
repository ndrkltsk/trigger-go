import React from 'react';
import { render } from '@testing-library/react-native';
import { ActionBar } from '@/components/runs/action-bar';
import { useNetworkStore } from '@/stores/network-store';

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

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

beforeEach(() => {
  useNetworkStore.setState({ isConnected: true, lastSyncTime: null });
});

describe('ActionBar accessibility', () => {
  it('cancel button has descriptive accessibility label', () => {
    const { getByLabelText } = render(
      <ActionBar
        status="EXECUTING"
        onCancel={jest.fn()}
        isCanceling={false}
      />
    );
    expect(getByLabelText('Cancel run')).toBeTruthy();
  });

  it('cancel button shows canceling label when in progress', () => {
    const { getByLabelText } = render(
      <ActionBar
        status="EXECUTING"
        onCancel={jest.fn()}
        isCanceling={true}
      />
    );
    expect(getByLabelText('Canceling run')).toBeTruthy();
  });

  it('replay button has descriptive accessibility label', () => {
    const { getByLabelText } = render(
      <ActionBar
        status="COMPLETED"
        onCancel={jest.fn()}
        onReplay={jest.fn()}
        isCanceling={false}
        isReplaying={false}
      />
    );
    expect(getByLabelText('Replay run')).toBeTruthy();
  });

});
