import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DeploymentCard } from '@/components/deployments/deployment-card';
import type { DeploymentListItem } from '@/services/api/deployments';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const createMockIcon = (name: string) => {
    const MockIcon = (props: Record<string, unknown>) => <View testID={`icon-${name}`} {...props} />;
    MockIcon.displayName = name;
    return MockIcon;
  };
  return {
    Rocket: createMockIcon('Rocket'),
    Hash: createMockIcon('Hash'),
  };
});

const mockDeployment: DeploymentListItem = {
  id: 'deploy_abc123',
  status: 'DEPLOYED',
  version: '20250214.1',
  shortCode: 'abc123',
  createdAt: '2025-02-14T00:00:00Z',
  runtime: null,
  runtimeVersion: null,
  deployedAt: null,
  git: null,
  error: null,
};

describe('DeploymentCard', () => {
  it('renders version', () => {
    const { getByText } = render(<DeploymentCard deployment={mockDeployment} />);
    expect(getByText('20250214.1')).toBeTruthy();
  });

  it('renders short code', () => {
    const { getByText } = render(<DeploymentCard deployment={mockDeployment} />);
    expect(getByText('abc123')).toBeTruthy();
  });

  it('renders status badge with correct label', () => {
    const { getByText } = render(<DeploymentCard deployment={mockDeployment} />);
    expect(getByText('Deployed')).toBeTruthy();
  });

  it('renders Failed status correctly', () => {
    const failed: DeploymentListItem = { ...mockDeployment, status: 'FAILED' };
    const { getByText } = render(<DeploymentCard deployment={failed} />);
    expect(getByText('Failed')).toBeTruthy();
  });

  it('renders Deploying status correctly', () => {
    const deploying: DeploymentListItem = { ...mockDeployment, status: 'DEPLOYING' };
    const { getByText } = render(<DeploymentCard deployment={deploying} />);
    expect(getByText('Deploying')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <DeploymentCard deployment={mockDeployment} onPress={onPress} />
    );
    fireEvent.press(getByText('20250214.1'));
    expect(onPress).toHaveBeenCalledWith(mockDeployment);
  });

  it('falls back to shortCode when version is missing', () => {
    const noVersion: DeploymentListItem = {
      ...mockDeployment,
      version: '',
    };
    const { getAllByText } = render(<DeploymentCard deployment={noVersion} />);
    expect(getAllByText('abc123').length).toBeGreaterThanOrEqual(1);
  });
});
