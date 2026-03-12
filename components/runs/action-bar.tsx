import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { isTerminalStatus } from '@/lib/status-colors';
import { RotateCcw } from 'lucide-react-native';
import { useNetworkStore } from '@/stores/network-store';
import { showOfflineToast } from '@/components/shared/offline-action-toast';

interface ActionBarProps {
  status: string;
  onCancel: () => void;
  onReplay?: () => void;
  isCanceling: boolean;
  isReplaying?: boolean;
}

export function ActionBar({
  status,
  onCancel,
  onReplay,
  isCanceling,
  isReplaying = false,
}: ActionBarProps) {
  const insets = useSafeAreaInsets();
  const isTerminal = isTerminalStatus(status);
  const isConnected = useNetworkStore((s) => s.isConnected);

  const handleCancel = () => {
    if (!isConnected) { showOfflineToast(); return; }
    onCancel();
  };

  const handleReplay = () => {
    if (!isConnected) { showOfflineToast(); return; }
    onReplay?.();
  };

  return (
    <View
      className="border-t border-border bg-card px-4 pt-3"
      style={{ paddingBottom: insets.bottom + 12 }}
    >
      {!isTerminal && (
        <Button
          variant="destructive"
          className={!isConnected ? 'opacity-50' : ''}
          onPress={handleCancel}
          disabled={isCanceling || !isConnected}
          accessibilityRole="button"
          accessibilityLabel={isCanceling ? 'Canceling run' : 'Cancel run'}
          accessibilityState={{ disabled: isCanceling || !isConnected }}
        >
          {isCanceling && <ActivityIndicator size="small" color="#fff" />}
          <Text className="text-sm font-medium text-white">
            {isCanceling ? 'Canceling...' : 'Cancel'}
          </Text>
        </Button>
      )}

      {isTerminal && (
        <Button
          variant="default"
          className={!isConnected ? 'opacity-50' : ''}
          onPress={handleReplay}
          disabled={isReplaying || !isConnected}
          accessibilityRole="button"
          accessibilityLabel={isReplaying ? 'Replaying run' : 'Replay run'}
          accessibilityState={{ disabled: isReplaying || !isConnected }}
        >
          {isReplaying ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <RotateCcw size={16} color="#fff" />
          )}
          <Text className="text-sm font-medium text-primary-foreground">
            {isReplaying ? 'Replaying...' : 'Replay'}
          </Text>
        </Button>
      )}
    </View>
  );
}
