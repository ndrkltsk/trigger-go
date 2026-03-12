import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { authenticate, getBiometricType, getBiometricLabel, type BiometricType } from '@/services/biometric/biometric-auth';

interface AppLockScreenProps {
  onUnlock: () => void;
}

export function AppLockScreen({ onUnlock }: AppLockScreenProps) {
  const [biometricType, setBiometricType] = useState<BiometricType>('none');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    getBiometricType().then(setBiometricType);
  }, []);

  useEffect(() => {
    if (biometricType !== 'none') {
      handleAuthenticate();
    }
  }, [biometricType]);

  const handleAuthenticate = async () => {
    setError(undefined);
    const label = getBiometricLabel(biometricType);
    const result = await authenticate(`Unlock with ${label}`);
    if (result.success) {
      onUnlock();
    } else {
      setError(result.error);
    }
  };

  const label = getBiometricLabel(biometricType);

  return (
    <View
      className="absolute inset-0 bg-background items-center justify-center z-50"
      style={{ backgroundColor: 'hsl(229, 24%, 5%)' }}
    >
      <View className="items-center gap-4 px-8">
        <Text className="text-[22px] font-bold text-foreground">Trigger.dev</Text>
        <Text className="text-mobile-secondary text-muted-foreground text-center">
          Unlock with {label}
        </Text>

        {error && (
          <Text className="text-mobile-secondary text-destructive text-center">{error}</Text>
        )}

        <Button onPress={handleAuthenticate} className="mt-4">
          <Text className="text-mobile-secondary font-medium text-primary-foreground">Try Again</Text>
        </Button>
      </View>
    </View>
  );
}
