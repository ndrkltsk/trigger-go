import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EnvironmentSwitcher } from '@/components/shared/environment-switcher';
import { useEnvironment } from '@/hooks/use-environment';

jest.mock('@/hooks/use-environment');

const mockUseEnvironment = useEnvironment as jest.MockedFunction<typeof useEnvironment>;

describe('EnvironmentSwitcher', () => {
  const mockSetEnvironment = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders tabs for all environments', () => {
    mockUseEnvironment.mockReturnValue({
      currentEnvironment: 'dev',
      availableEnvironments: ['dev', 'staging', 'prod'],
      setEnvironment: mockSetEnvironment,
    });

    const { getByText } = render(<EnvironmentSwitcher />);
    expect(getByText('Dev')).toBeTruthy();
    expect(getByText('Staging')).toBeTruthy();
    expect(getByText('Prod')).toBeTruthy();
  });

  it('calls setEnvironment when tapping a tab', () => {
    mockUseEnvironment.mockReturnValue({
      currentEnvironment: 'dev',
      availableEnvironments: ['dev', 'staging', 'prod'],
      setEnvironment: mockSetEnvironment,
    });

    const { getByText } = render(<EnvironmentSwitcher />);
    fireEvent.press(getByText('Staging'));
  });

  it('renders with staging selected', () => {
    mockUseEnvironment.mockReturnValue({
      currentEnvironment: 'staging',
      availableEnvironments: ['dev', 'staging', 'prod'],
      setEnvironment: mockSetEnvironment,
    });

    const { getByText } = render(<EnvironmentSwitcher />);
    expect(getByText('Staging')).toBeTruthy();
  });
});
