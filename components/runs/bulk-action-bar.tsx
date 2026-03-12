import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

const TAB_BAR_HEIGHT = 49;

interface BulkActionBarProps {
  selectedCount: number;
  onCancelAll: () => void;
  onReplayAll: () => void;
  onDeselectAll: () => void;
  isCanceling?: boolean;
  isReplaying?: boolean;
}

export function BulkActionBar({
  selectedCount,
  onCancelAll,
  onReplayAll,
  onDeselectAll,
  isCanceling,
  isReplaying,
}: BulkActionBarProps) {
  const insets = useSafeAreaInsets();

  if (selectedCount === 0) return null;

  return (
    <View
      className="border-t border-border bg-card px-4 pt-3"
      style={{ paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 12 }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-semibold text-foreground" accessibilityRole="text">
          {selectedCount} selected
        </Text>
        <Button variant="ghost" size="sm" onPress={onDeselectAll} accessibilityLabel="Deselect all runs">
          <Text className="text-xs text-muted-foreground">Deselect All</Text>
        </Button>
      </View>
      <View className="flex-row gap-2">
        <Button
          variant="destructive"
          className="flex-1"
          onPress={onCancelAll}
          disabled={isCanceling || isReplaying}
          accessibilityLabel={isCanceling ? `Canceling ${selectedCount} runs` : `Cancel ${selectedCount} selected runs`}
          accessibilityState={{ disabled: isCanceling || isReplaying }}
        >
          <Text className="text-sm font-medium text-white">
            {isCanceling ? 'Canceling...' : 'Cancel All'}
          </Text>
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onPress={onReplayAll}
          disabled={isCanceling || isReplaying}
          accessibilityLabel={isReplaying ? `Replaying ${selectedCount} runs` : `Replay ${selectedCount} selected runs`}
          accessibilityState={{ disabled: isCanceling || isReplaying }}
        >
          <Text className="text-sm font-medium">
            {isReplaying ? 'Replaying...' : 'Replay All'}
          </Text>
        </Button>
      </View>
    </View>
  );
}
