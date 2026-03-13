import * as LocalAuthentication from 'expo-local-authentication';
import { metrics } from '@/services/sentry';

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
  metrics.count('biometric.auth.attempt', 1);
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
    });

    if (result.success) {
      metrics.count('biometric.auth.success', 1);
      return { success: true };
    }

    metrics.count('biometric.auth.failure', 1);
    return {
      success: false,
      error: result.error ?? 'Authentication failed',
    };
  } catch {
    metrics.count('biometric.auth.failure', 1, { attributes: { reason: 'unavailable' } });
    return { success: false, error: 'Authentication unavailable' };
  }
}
