import { useState, useCallback } from 'react';
import { View, TextInput, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react-native';

interface TriggerPayloadEditorProps {
  value: string;
  onChange: (json: string) => void;
  error?: string;
}

export function TriggerPayloadEditor({ value, onChange, error }: TriggerPayloadEditorProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = error || localError;

  const handleBlur = useCallback(() => {
    if (!value.trim()) {
      setLocalError(null);
      return;
    }
    try {
      JSON.parse(value);
      setLocalError(null);
    } catch (e) {
      const msg = e instanceof SyntaxError ? e.message : 'Invalid JSON';
      setLocalError(`Invalid JSON: ${msg}`);
    }
  }, [value]);

  const handleClear = useCallback(() => {
    onChange('');
    setLocalError(null);
  }, [onChange]);

  return (
    <View className="gap-1.5">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-foreground">Payload (JSON)</Text>
        {value.length > 0 && (
          <Button variant="ghost" size="sm" onPress={handleClear} className="h-7 px-2">
            <X size={14} color="#a1a1aa" />
            <Text className="text-xs text-muted-foreground">Clear</Text>
          </Button>
        )}
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        onBlur={handleBlur}
        placeholder={'{ "key": "value" }'}
        placeholderTextColor="#71717a"
        multiline
        textAlignVertical="top"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        style={{
          fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
          fontSize: 13,
          lineHeight: 20,
          minHeight: 200,
          padding: 12,
        }}
        className="border-input bg-muted/30 text-foreground rounded-md border"
      />
      {displayError && (
        <Text className="text-xs text-destructive">{displayError}</Text>
      )}
    </View>
  );
}
