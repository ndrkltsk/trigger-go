import { useState, useCallback } from 'react';
import { View, TextInput, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Pencil, X, ChevronDown, ChevronUp } from 'lucide-react-native';

interface BatchItemCardProps {
  index: number;
  taskIdentifier: string;
  payload: string;
  onEdit: (payload: string) => void;
  onRemove: () => void;
}

function getPayloadPreview(payload: string): string {
  if (!payload.trim()) return '(empty payload)';
  const lines = payload.split('\n');
  if (lines.length <= 2) return payload;
  return lines.slice(0, 2).join('\n') + '...';
}

export function BatchItemCard({
  index,
  taskIdentifier,
  payload,
  onEdit,
  onRemove,
}: BatchItemCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <View className="bg-card border-border border rounded-lg overflow-hidden">
      <View className="flex-row items-center px-3 py-2.5 gap-2">
        <View className="bg-muted w-6 h-6 rounded-full items-center justify-center">
          <Text className="text-xs font-bold text-muted-foreground">{index + 1}</Text>
        </View>
        <Text className="text-sm font-medium text-foreground flex-1" numberOfLines={1}>
          {taskIdentifier}
        </Text>
        <Button variant="ghost" size="icon" className="h-8 w-8" onPress={handleToggle}>
          {expanded ? (
            <ChevronUp size={14} color="#a1a1aa" />
          ) : (
            <Pencil size={14} color="#a1a1aa" />
          )}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onPress={onRemove}>
          <X size={14} color="#ef4444" />
        </Button>
      </View>

      {!expanded && payload.trim() !== '' && (
        <View className="px-3 pb-2.5 pt-0">
          <Text
            className="text-xs font-mono text-muted-foreground"
            numberOfLines={2}
          >
            {getPayloadPreview(payload)}
          </Text>
        </View>
      )}

      {expanded && (
        <View className="px-3 pb-3 pt-0">
          <TextInput
            value={payload}
            onChangeText={onEdit}
            placeholder={'{ "key": "value" }'}
            placeholderTextColor="#71717a"
            multiline
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            style={{
              fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
              fontSize: 12,
              lineHeight: 18,
              minHeight: 100,
              padding: 8,
            }}
            className="border-input bg-muted/30 text-foreground rounded-md border"
          />
        </View>
      )}
    </View>
  );
}
