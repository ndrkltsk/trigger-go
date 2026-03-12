import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { usePreferencesStore } from '@/stores/preferences-store';

const GRACE_PERIOD_MS = 5000;

export function useAppLock() {
  const biometricLockEnabled = usePreferencesStore((s) => s.biometricLockEnabled);
  const [isLocked, setIsLocked] = useState(false);
  const backgroundTimestamp = useRef<number | null>(null);
  const hasShownInitialLock = useRef(false);

  const unlock = useCallback(() => {
    setIsLocked(false);
    backgroundTimestamp.current = null;
  }, []);

  // Lock on initial app launch when biometric lock is enabled
  useEffect(() => {
    if (biometricLockEnabled && !hasShownInitialLock.current) {
      hasShownInitialLock.current = true;
      setIsLocked(true);
    }
  }, [biometricLockEnabled]);

  useEffect(() => {
    if (!biometricLockEnabled) {
      setIsLocked(false);
      return;
    }

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundTimestamp.current = Date.now();
      } else if (nextState === 'active') {
        if (backgroundTimestamp.current) {
          const elapsed = Date.now() - backgroundTimestamp.current;
          if (elapsed > GRACE_PERIOD_MS) {
            setIsLocked(true);
          }
          backgroundTimestamp.current = null;
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [biometricLockEnabled]);

  return { isLocked, unlock };
}
