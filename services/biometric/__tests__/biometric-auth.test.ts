import {
  isBiometricAvailable,
  getBiometricType,
  getBiometricLabel,
  authenticate,
} from '@/services/biometric/biometric-auth';

const mockHasHardwareAsync = jest.fn();
const mockIsEnrolledAsync = jest.fn();
const mockSupportedAuthenticationTypesAsync = jest.fn();
const mockAuthenticateAsync = jest.fn();

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: () => mockHasHardwareAsync(),
  isEnrolledAsync: () => mockIsEnrolledAsync(),
  supportedAuthenticationTypesAsync: () => mockSupportedAuthenticationTypesAsync(),
  authenticateAsync: (opts: unknown) => mockAuthenticateAsync(opts),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('isBiometricAvailable', () => {
  it('returns false when no hardware', async () => {
    mockHasHardwareAsync.mockResolvedValue(false);
    expect(await isBiometricAvailable()).toBe(false);
    expect(mockIsEnrolledAsync).not.toHaveBeenCalled();
  });

  it('returns false when hardware exists but not enrolled', async () => {
    mockHasHardwareAsync.mockResolvedValue(true);
    mockIsEnrolledAsync.mockResolvedValue(false);
    expect(await isBiometricAvailable()).toBe(false);
  });

  it('returns true when hardware exists and enrolled', async () => {
    mockHasHardwareAsync.mockResolvedValue(true);
    mockIsEnrolledAsync.mockResolvedValue(true);
    expect(await isBiometricAvailable()).toBe(true);
  });
});

describe('getBiometricType', () => {
  it('returns none when no hardware', async () => {
    mockHasHardwareAsync.mockResolvedValue(false);
    expect(await getBiometricType()).toBe('none');
  });

  it('returns face-id for facial recognition', async () => {
    mockHasHardwareAsync.mockResolvedValue(true);
    mockSupportedAuthenticationTypesAsync.mockResolvedValue([2]);
    expect(await getBiometricType()).toBe('face-id');
  });

  it('returns fingerprint for fingerprint', async () => {
    mockHasHardwareAsync.mockResolvedValue(true);
    mockSupportedAuthenticationTypesAsync.mockResolvedValue([1]);
    expect(await getBiometricType()).toBe('fingerprint');
  });

  it('prefers face-id over fingerprint', async () => {
    mockHasHardwareAsync.mockResolvedValue(true);
    mockSupportedAuthenticationTypesAsync.mockResolvedValue([1, 2]);
    expect(await getBiometricType()).toBe('face-id');
  });

  it('returns none when no supported types', async () => {
    mockHasHardwareAsync.mockResolvedValue(true);
    mockSupportedAuthenticationTypesAsync.mockResolvedValue([]);
    expect(await getBiometricType()).toBe('none');
  });
});

describe('getBiometricLabel', () => {
  it('returns Face ID', () => {
    expect(getBiometricLabel('face-id')).toBe('Face ID');
  });

  it('returns Touch ID', () => {
    expect(getBiometricLabel('touch-id')).toBe('Touch ID');
  });

  it('returns Fingerprint', () => {
    expect(getBiometricLabel('fingerprint')).toBe('Fingerprint');
  });

  it('returns Biometric for none', () => {
    expect(getBiometricLabel('none')).toBe('Biometric');
  });
});

describe('authenticate', () => {
  it('returns success on successful auth', async () => {
    mockAuthenticateAsync.mockResolvedValue({ success: true });
    const result = await authenticate('Test reason');
    expect(result).toEqual({ success: true });
    expect(mockAuthenticateAsync).toHaveBeenCalledWith({
      promptMessage: 'Test reason',
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
    });
  });

  it('returns error on failed auth', async () => {
    mockAuthenticateAsync.mockResolvedValue({
      success: false,
      error: 'user_cancel',
    });
    const result = await authenticate();
    expect(result).toEqual({ success: false, error: 'user_cancel' });
  });

  it('handles thrown errors gracefully', async () => {
    mockAuthenticateAsync.mockRejectedValue(new Error('Native error'));
    const result = await authenticate();
    expect(result).toEqual({ success: false, error: 'Authentication unavailable' });
  });
});
