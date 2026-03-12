import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Text } from '@/components/ui/text';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react-native';
import type { SerializedError } from '@/services/api/runs';

interface RunErrorDisplayProps {
  error: SerializedError | null | undefined;
}

export function RunErrorDisplay({ error }: RunErrorDisplayProps) {
  const [stackOpen, setStackOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!error) return null;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(error.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-2">
          {error.name && (
            <Text className="text-sm font-bold text-destructive mb-1">{error.name}</Text>
          )}
          <Text className="text-sm text-foreground">{error.message}</Text>
        </View>
        <Pressable onPress={handleCopy} className="p-1">
          {copied ? (
            <Check size={14} color="#22c55e" />
          ) : (
            <Copy size={14} color="#8B95A5" />
          )}
        </Pressable>
      </View>

      {error.stackTrace && (
        <Collapsible open={stackOpen} onOpenChange={setStackOpen} className="mt-3">
          <CollapsibleTrigger asChild>
            <Pressable className="flex-row items-center gap-1">
              {stackOpen ? (
                <ChevronDown size={12} color="#8B95A5" />
              ) : (
                <ChevronRight size={12} color="#8B95A5" />
              )}
              <Text className="text-xs text-muted-foreground font-medium">Stack trace</Text>
            </Pressable>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ScrollView horizontal className="mt-2">
              <Text className="text-[11px] font-mono text-muted-foreground">
                {error.stackTrace}
              </Text>
            </ScrollView>
          </CollapsibleContent>
        </Collapsible>
      )}
    </View>
  );
}
