import { View } from 'react-native';
import { Text } from '../text';

export interface BottomSheetRef {
  present: (index?: number, animated?: boolean) => Promise<void>;
  dismiss: (animated?: boolean) => Promise<void>;
}

export interface BottomSheetHeaderProps {
  title: string;
}

export const BottomSheetHeader = (props: BottomSheetHeaderProps) => {
  const { title } = props;
  return (
    <View className="pt-4 pb-2 px-4 border-b border-border">
      <Text className="text-lg font-semibold text-foreground">{title}</Text>
    </View>
  );
}

BottomSheetHeader.displayName = 'BottomSheetHeader';
