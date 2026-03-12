import { forwardRef, useImperativeHandle, useRef, useState, useCallback } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet, type BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '@/components/ui/bottom-sheet/bottom-sheet-header';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export interface ConfirmSheetRef {
  present: (params?: { title?: string; description?: string }) => Promise<void>;
  dismiss: () => Promise<void>;
}

interface ConfirmSheetProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'default';
  isPending?: boolean;
  onConfirm: () => void;
}

export const ConfirmSheet = forwardRef<ConfirmSheetRef, ConfirmSheetProps>(
  ({ title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'destructive', isPending = false, onConfirm }, ref) => {
    const sheetRef = useRef<BottomSheetRef>(null);
    const insets = useSafeAreaInsets();
    const isIPad = Platform.OS === 'ios' && Platform.isPad;
    const bottomInset = isIPad ? 0 : insets.bottom;

    const [dynamicTitle, setDynamicTitle] = useState<string | undefined>();
    const [dynamicDescription, setDynamicDescription] = useState<string | undefined>();

    useImperativeHandle(ref, () => ({
      present: async (params) => {
        setDynamicTitle(params?.title);
        setDynamicDescription(params?.description);
        await sheetRef.current?.present();
      },
      dismiss: async () => {
        await sheetRef.current?.dismiss();
      },
    }));

    const handleConfirm = useCallback(() => {
      onConfirm();
    }, [onConfirm]);

    const isDestructive = variant === 'destructive';

    return (
      <BottomSheet
        ref={sheetRef}
        header={<BottomSheetHeader title={dynamicTitle ?? title} />}
        footer={
          <View style={{ paddingBottom: insets.bottom / 2 }} className="px-4 pt-3 flex-row gap-2">
            <Button
              variant="glass"
              onPress={() => sheetRef.current?.dismiss()}
              disabled={isPending}
              className="flex-1"
            >
              <Text className="text-sm font-medium">{cancelLabel}</Text>
            </Button>
            <Button
              variant="glass"
              glassTintColor={isDestructive ? 'rgb(239, 68, 68)' : 'rgb(38, 217, 104)'}
              onPress={handleConfirm}
              disabled={isPending}
              className="flex-1"
            >
              {isPending && <ActivityIndicator size="small" color="#fff" />}
              <Text className="text-sm font-medium text-primary-foreground">
                {isPending ? `${confirmLabel}...` : confirmLabel}
              </Text>
            </Button>
          </View>
        }
      >
        <View className="px-4 pt-4 pb-6">
          <Text className="text-sm text-muted-foreground">
            {dynamicDescription ?? description}
          </Text>
        </View>
      </BottomSheet>
    );
  }
);

ConfirmSheet.displayName = 'ConfirmSheet';
