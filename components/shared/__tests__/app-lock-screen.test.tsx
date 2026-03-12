import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AppLockScreen } from '@/components/shared/app-lock-screen';

const mockGetBiometricType = jest.fn();
const mockAuthenticate = jest.fn();

jest.mock('@/services/biometric/biometric-auth', () => ({
  getBiometricType: () => mockGetBiometricType(),
  getBiometricLabel: (type: string) => {
    const labels: Record<string, string> = {
      'face-id': 'Face ID',
      fingerprint: 'Fingerprint',
      none: 'Biometric',
    };
    return labels[type] ?? 'Biometric';
  },
  authenticate: (...args: unknown[]) => mockAuthenticate(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockGetBiometricType.mockResolvedValue('face-id');
  mockAuthenticate.mockResolvedValue({ success: false, error: 'user_cancel' });
});

describe('AppLockScreen', () => {
  it('renders lock screen with unlock text', async () => {
    const { getByText } = render(<AppLockScreen onUnlock={jest.fn()} />);
    expect(getByText('Trigger.dev')).toBeTruthy();
    await waitFor(() => {
      expect(getByText('Unlock with Face ID')).toBeTruthy();
    });
  });

  it('triggers authentication on mount', async () => {
    render(<AppLockScreen onUnlock={jest.fn()} />);
    await waitFor(() => {
      expect(mockAuthenticate).toHaveBeenCalledWith('Unlock with Face ID');
    });
  });

  it('calls onUnlock on successful authentication', async () => {
    mockAuthenticate.mockResolvedValue({ success: true });
    const onUnlock = jest.fn();
    render(<AppLockScreen onUnlock={onUnlock} />);
    await waitFor(() => {
      expect(onUnlock).toHaveBeenCalled();
    });
  });

  it('shows error message on failed authentication', async () => {
    mockAuthenticate.mockResolvedValue({ success: false, error: 'user_cancel' });
    const { getByText } = render(<AppLockScreen onUnlock={jest.fn()} />);
    await waitFor(() => {
      expect(getByText('user_cancel')).toBeTruthy();
    });
  });

  it('has a Try Again button', async () => {
    const { getByText } = render(<AppLockScreen onUnlock={jest.fn()} />);
    await waitFor(() => {
      expect(getByText('Try Again')).toBeTruthy();
    });
  });

  it('retries authentication on Try Again press', async () => {
    mockAuthenticate.mockResolvedValue({ success: false, error: 'failed' });
    const { getByText } = render(<AppLockScreen onUnlock={jest.fn()} />);

    await waitFor(() => {
      expect(mockAuthenticate).toHaveBeenCalledTimes(1);
    });

    mockAuthenticate.mockResolvedValue({ success: true });
    const onUnlock = jest.fn();

    // Re-render with fresh onUnlock won't work, let's test the button fires
    fireEvent.press(getByText('Try Again'));

    await waitFor(() => {
      expect(mockAuthenticate).toHaveBeenCalledTimes(2);
    });
  });
});
