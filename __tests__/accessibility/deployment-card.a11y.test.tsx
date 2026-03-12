import React from 'react';
import { render } from '@testing-library/react-native';
import { DeploymentCard } from '@/components/deployments/deployment-card';
import type { DeploymentListItem } from '@/services/api/deployments';

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

const mockDeployment: DeploymentListItem = {
  id: 'dep_abc123',
  version: 'v1.2.3',
  shortCode: 'abc12',
  status: 'DEPLOYED',
  createdAt: '2025-01-01T00:00:00Z',
  runtime: null,
  runtimeVersion: null,
  deployedAt: null,
  git: null,
  error: null,
};

describe('DeploymentCard accessibility', () => {
  it('has an accessibility role of button', () => {
    const { getByRole } = render(
      <DeploymentCard deployment={mockDeployment} onPress={jest.fn()} />
    );
    expect(getByRole('button')).toBeTruthy();
  });

  it('accessibility label contains version', () => {
    const { getByLabelText } = render(
      <DeploymentCard deployment={mockDeployment} onPress={jest.fn()} />
    );
    expect(getByLabelText(/v1\.2\.3/)).toBeTruthy();
  });

  it('accessibility label contains status', () => {
    const { getByLabelText } = render(
      <DeploymentCard deployment={mockDeployment} onPress={jest.fn()} />
    );
    expect(getByLabelText(/Deployed/)).toBeTruthy();
  });

  it('decorative icons are hidden from accessibility', () => {
    const { getByTestId } = render(
      <DeploymentCard deployment={mockDeployment} onPress={jest.fn()} />
    );
    const rocketIcon = getByTestId('icon-Rocket');
    expect(rocketIcon.props.importantForAccessibility).toBe('no');
  });
});
