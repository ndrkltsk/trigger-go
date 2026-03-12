import { forwardRef, useState, useCallback, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet, type BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '@/components/ui/bottom-sheet/bottom-sheet-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

interface EnvVarFormProps {
  mode: 'create' | 'edit';
  initialName?: string;
  initialValue?: string;
  onSubmit: (name: string, value: string) => void;
  isPending: boolean;
  error?: string | null;
  onDismiss?: () => void;
}

const ENV_VAR_NAME_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;

export const EnvVarForm = forwardRef<BottomSheetRef, EnvVarFormProps>(
  ({ mode, initialName = '', initialValue = '', onSubmit, isPending, error, onDismiss }, ref) => {
    const sheetRef = useRef<BottomSheetRef>(null);
    const insets = useSafeAreaInsets();
    const [name, setName] = useState(initialName);
    const [value, setValue] = useState(initialValue);
    const [nameError, setNameError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      present: async () => {
        setName(initialName);
        setValue(initialValue);
        setNameError(null);
        await sheetRef.current?.present();
      },
      dismiss: async () => { await sheetRef.current?.dismiss(); },
    }));

    const handleSubmit = useCallback(() => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setNameError('Name is required');
        return;
      }
      if (!ENV_VAR_NAME_REGEX.test(trimmedName)) {
        setNameError('Name must start with a letter or underscore, and contain only letters, numbers, and underscores');
        return;
      }
      setNameError(null);
      onSubmit(trimmedName, value);
    }, [name, value, onSubmit]);

    const isCreate = mode === 'create';

    return (
      <BottomSheet
        ref={sheetRef}
        onDidDismiss={onDismiss}
        header={<BottomSheetHeader title={isCreate ? 'Create Variable' : 'Edit Variable'} />}
        footer={
          <View style={{ paddingBottom: insets.bottom / 2 }} className="px-4 pt-3 flex-row gap-2">
            <Button variant="glass" onPress={() => sheetRef.current?.dismiss()} className="flex-1">
              <Text className="text-sm font-medium">Cancel</Text>
            </Button>
            <Button glassTintColor='rgb(38, 217, 104)' variant="glass" onPress={handleSubmit} disabled={isPending} className="flex-1">
              <Text className="text-sm font-medium text-primary-foreground">
                {isPending
                  ? isCreate
                    ? 'Creating...'
                    : 'Saving...'
                  : isCreate
                    ? 'Create'
                    : 'Save'}
              </Text>
            </Button>
          </View>
        }
      >
        <View className="px-4 pb-6 gap-4">
          <View className="gap-3">
            <View>
              <Text className="text-xs font-medium text-muted-foreground mb-1">Name</Text>
              <Input
                value={name}
                onChangeText={setName}
                placeholder="VARIABLE_NAME"
                autoCapitalize="characters"
                autoCorrect={false}
                editable={isCreate}
              />
              {nameError && (
                <Text className="text-xs text-destructive mt-1">{nameError}</Text>
              )}
            </View>

            <View>
              <Text className="text-xs font-medium text-muted-foreground mb-1">Value</Text>
              <Input
                value={value}
                onChangeText={setValue}
                placeholder="Enter value..."
                autoCapitalize="none"
                autoCorrect={false}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="min-h-[80px] py-2"
              />
            </View>

            {error && (
              <Text className="text-xs text-destructive">{error}</Text>
            )}
          </View>
        </View>
      </BottomSheet>
    );
  }
);

EnvVarForm.displayName = 'EnvVarForm';
