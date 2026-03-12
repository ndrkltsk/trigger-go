import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { TrueSheet, TrueSheetProps } from '@lodev09/react-native-true-sheet';
import { MOBILE } from '@/lib/design-tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface BottomSheetRef {
  present: (index?: number, animated?: boolean) => Promise<void>;
  dismiss: (animated?: boolean) => Promise<void>;
}

export interface BottomSheetProps extends Omit<TrueSheetProps, 'detents' | 'cornerRadius'> {
  detents?: TrueSheetProps['detents'];
  cornerRadius?: number;
}

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  ({ detents = ['auto', 1], cornerRadius = MOBILE.radius.sheet, children, style, ...props }, ref) => {
    const trueSheetRef = useRef<TrueSheet>(null);
    const insets = useSafeAreaInsets();

    useImperativeHandle(ref, () => ({
      present: async (index?: number, animated?: boolean) => {
        await trueSheetRef.current?.present(index, animated);
      },
      dismiss: async (animated?: boolean) => {
        await trueSheetRef.current?.dismiss(animated);
      },
    }));

    return (
      <TrueSheet
        ref={trueSheetRef}
        detents={detents}
        grabber
        style={style}
        {...props}
      >
        {children}
        <View style={{ height: insets.bottom }} />
      </TrueSheet>
    );
  }
);

BottomSheet.displayName = 'BottomSheet';
