import { AppState } from 'react-native';
import { usePreferencesStore } from '@/stores/preferences-store';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('useAppLock store behavior', () => {
  beforeEach(() => {
    usePreferencesStore.setState({
      biometricLockEnabled: false,
      biometricForSensitiveActions: false,
    });
  });

  it('biometric lock is disabled by default', () => {
    const state = usePreferencesStore.getState();
    expect(state.biometricLockEnabled).toBe(false);
  });

  it('can enable biometric lock', () => {
    usePreferencesStore.getState().setBiometricLockEnabled(true);
    expect(usePreferencesStore.getState().biometricLockEnabled).toBe(true);
  });

  it('can disable biometric lock', () => {
    usePreferencesStore.getState().setBiometricLockEnabled(true);
    usePreferencesStore.getState().setBiometricLockEnabled(false);
    expect(usePreferencesStore.getState().biometricLockEnabled).toBe(false);
  });

  it('disabling biometric lock also disables sensitive actions', () => {
    usePreferencesStore.getState().setBiometricLockEnabled(true);
    usePreferencesStore.getState().setBiometricForSensitiveActions(true);
    expect(usePreferencesStore.getState().biometricForSensitiveActions).toBe(true);

    usePreferencesStore.getState().setBiometricLockEnabled(false);
    expect(usePreferencesStore.getState().biometricForSensitiveActions).toBe(false);
  });

  it('can toggle sensitive actions independently', () => {
    usePreferencesStore.getState().setBiometricLockEnabled(true);
    usePreferencesStore.getState().setBiometricForSensitiveActions(true);
    expect(usePreferencesStore.getState().biometricForSensitiveActions).toBe(true);

    usePreferencesStore.getState().setBiometricForSensitiveActions(false);
    expect(usePreferencesStore.getState().biometricForSensitiveActions).toBe(false);
  });
});
