import { useEffect } from 'react';
import { View } from 'react-native';
import type { ErrorBoundaryProps } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Sentry } from '@/services/sentry';

export function RootErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <View className="flex-1 bg-background items-center justify-center px-8">
      <Text variant="h3" className="text-center mb-2 border-b-0">
        Something went wrong
      </Text>
      <Text variant="muted" className="text-center mb-6">
        {error.message}
      </Text>
      <Button variant="outline" onPress={retry}>
        <Text className="text-sm font-medium">Try Again</Text>
      </Button>
    </View>
  );
}
