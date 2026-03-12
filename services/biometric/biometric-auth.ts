import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricType = 'face-id' | 'touch-id' | 'fingerprint' | 'none';

export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

export async function getBiometricType(): Promise<BiometricType> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return 'none';

  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'face-id';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'fingerprint';
  }
  return 'none';
}

export function getBiometricLabel(type: BiometricType): string {
  switch (type) {
    case 'face-id':
      return 'Face ID';
    case 'touch-id':
      return 'Touch ID';
    case 'fingerprint':
      return 'Fingerprint';
    case 'none':
      return 'Biometric';
  }
}

export async function authenticate(
  reason: string = 'Authenticate to unlock the app'
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
    });

    if (result.success) {
      return { success: true };
    }

    return {
      success: false,
      error: result.error ?? 'Authentication failed',
    };
  } catch {
    return { success: false, error: 'Authentication unavailable' };
  }
}
