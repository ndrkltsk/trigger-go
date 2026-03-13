import { View } from 'react-native';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { TABLET } from '@/lib/design-tokens';

const VARIANT_MAX_WIDTH = {
  dashboard: TABLET.maxContentWidth,
  reading: TABLET.maxReadingWidth,
  form: TABLET.maxFormWidth,
} as const;

interface ContentContainerProps {
  variant?: keyof typeof VARIANT_MAX_WIDTH;
  children: React.ReactNode;
}

export function ContentContainer({ variant = 'dashboard', children }: ContentContainerProps) {
  const { isTablet } = useDeviceLayout();

  if (!isTablet) {
    return <>{children}</>;
  }

  return (
    <View style={{ alignSelf: 'center', width: '100%', maxWidth: VARIANT_MAX_WIDTH[variant] }}>
      {children}
    </View>
  );
}
