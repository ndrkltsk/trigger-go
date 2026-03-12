import { forwardRef, useState, useCallback, useImperativeHandle, useRef } from 'react';
import { View, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet, type BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '@/components/ui/bottom-sheet/bottom-sheet-header';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

interface MetadataEditorProps {
  currentMetadata: Record<string, unknown>;
  onSave: (metadata: Record<string, unknown>) => void;
  isPending: boolean;
}

export const MetadataEditor = forwardRef<BottomSheetRef, MetadataEditorProps>(
  ({ currentMetadata, onSave, isPending }, ref) => {
    const sheetRef = useRef<BottomSheetRef>(null);
    const insets = useSafeAreaInsets();
    const [value, setValue] = useState('');
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      present: async () => {
        setValue(JSON.stringify(currentMetadata, null, 2));
        setError(null);
        await sheetRef.current?.present();
      },
      dismiss: async () => { await sheetRef.current?.dismiss(); },
    }));

    const handleSave = useCallback(() => {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          setError('Metadata must be a JSON object');
          return;
        }
        setError(null);
        onSave(parsed);
      } catch (e) {
        const msg = e instanceof SyntaxError ? e.message : 'Invalid JSON';
        setError(`Invalid JSON: ${msg}`);
      }
    }, [value, onSave]);

    return (
      <BottomSheet
        ref={sheetRef}
        detents={['auto', 1]}
        header={<BottomSheetHeader title="Edit Metadata" />}
        footer={
          <View style={{ paddingBottom: insets.bottom / 2 }} className="px-4 pt-3 flex-row gap-2">
            <Button variant="glass" onPress={() => sheetRef.current?.dismiss()} className="flex-1">
              <Text className="text-sm font-medium">Cancel</Text>
            </Button>
            <Button glassTintColor='rgb(38, 217, 104)' variant="glass" onPress={handleSave} disabled={isPending} className="flex-1">
              <Text className="text-sm font-medium text-primary-foreground">
                {isPending ? 'Saving...' : 'Save'}
              </Text>
            </Button>
          </View>
        }
      >
        <View className="px-4 pb-6 gap-4">
          <TextInput
            value={value}
            onChangeText={setValue}
            multiline
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            style={{
              fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
              fontSize: 13,
              lineHeight: 20,
              minHeight: 250,
              maxHeight: 400,
              padding: 12,
            }}
            className="border-input bg-muted/30 text-foreground rounded-md border"
          />

          {error && (
            <Text className="text-xs text-destructive">{error}</Text>
          )}
        </View>
      </BottomSheet>
    );
  }
);

MetadataEditor.displayName = 'MetadataEditor';
