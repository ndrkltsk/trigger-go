import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { CheckCircle, Clock, TimerOff, XCircle } from 'lucide-react-native';

/**
 * @deprecated Use RunAttemptsTab (trace-based) instead.
 * Kept for barrel export compatibility.
 */
export function RunTimeline({ message }: { message?: string }) {
  return (
    <View className="items-center justify-center py-8 px-4">
      <Icon as={Clock} size={32} className="text-muted-foreground mb-2" />
      <Text variant="muted" className="text-center">
        {message ?? 'Use the Attempts tab to view attempt details.'}
      </Text>
    </View>
  );
}
