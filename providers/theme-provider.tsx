import React from 'react';
import { View } from 'react-native';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <View className="dark flex-1" style={{ flex: 1 }}>
      {children}
    </View>
  );
}

export { useTheme } from '@/hooks/use-theme';
