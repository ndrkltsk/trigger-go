import { forwardRef, useState, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BottomSheet, type BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '@/components/ui/bottom-sheet/bottom-sheet-header';
import { isValidTokenFormat } from '@/lib/validation';
import { API_BASE_URL } from '@/lib/constants';

interface ProfileFormDialogProps {
  mode: 'create' | 'rename';
  initialName?: string;
  onSave: (data: { name: string; apiKey?: string; serverUrl?: string }) => void;
  onDismiss?: () => void;
}

export const ProfileFormDialog = forwardRef<BottomSheetRef, ProfileFormDialogProps>(
  ({ mode, initialName = '', onSave, onDismiss }, ref) => {
    const sheetRef = useRef<BottomSheetRef>(null);
    const insets = useSafeAreaInsets();
    const [name, setName] = useState(initialName);
    const [apiKey, setApiKey] = useState('');
    const [serverUrl, setServerUrl] = useState(API_BASE_URL);
    const [error, setError] = useState('');

    useImperativeHandle(ref, () => ({
      present: async () => {
        setName(initialName);
        setApiKey('');
        setServerUrl(API_BASE_URL);
        setError('');
        await sheetRef.current?.present();
      },
      dismiss: async () => { await sheetRef.current?.dismiss(); },
    }));

    const handleSave = () => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setError('Profile name is required');
        return;
      }

      if (mode === 'create') {
        if (!apiKey.trim()) {
          setError('API key is required');
          return;
        }
        if (!isValidTokenFormat(apiKey.trim())) {
          setError('Invalid token format. Must start with tr_pat_');
          return;
        }
        onSave({ name: trimmedName, apiKey: apiKey.trim(), serverUrl: serverUrl.trim() || API_BASE_URL });
      } else {
        onSave({ name: trimmedName });
      }
    };

    return (
      <BottomSheet
        ref={sheetRef}
        onDidDismiss={onDismiss}
        header={<BottomSheetHeader title={mode === 'create' ? 'Add Profile' : 'Rename Profile'} />}
        footer={
          <View style={{ paddingBottom: insets.bottom / 2 }} className="px-4 pt-3 flex-row gap-2">
            <Button variant="glass" onPress={() => sheetRef.current?.dismiss()} className="flex-1">
              <Text className="text-sm font-medium">Cancel</Text>
            </Button>
            <Button glassTintColor='rgb(38, 217, 104)' variant="glass" onPress={handleSave} className="flex-1">
              <Text className="text-sm font-medium text-primary-foreground">
                {mode === 'create' ? 'Save Profile' : 'Rename'}
              </Text>
            </Button>
          </View>
        }
      >
        <View className="px-4 pb-6 gap-4">
          <View className="gap-4">
            <View>
              <Label className="text-sm text-foreground mb-1">Profile Name</Label>
              <Input
                value={name}
                onChangeText={setName}
                placeholder="e.g., Production - My SaaS"
                autoFocus
              />
            </View>

            {mode === 'create' && (
              <>
                <View>
                  <Label className="text-sm text-foreground mb-1">API Key</Label>
                  <Input
                    value={apiKey}
                    onChangeText={setApiKey}
                    placeholder="tr_pat_..."
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View>
                  <Label className="text-sm text-foreground mb-1">Server URL</Label>
                  <Input
                    value={serverUrl}
                    onChangeText={setServerUrl}
                    placeholder={API_BASE_URL}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                </View>
              </>
            )}

            {error ? (
              <Text className="text-xs text-destructive">{error}</Text>
            ) : null}
          </View>
        </View>
      </BottomSheet>
    );
  }
);

ProfileFormDialog.displayName = 'ProfileFormDialog';
