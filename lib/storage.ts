import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({
  id: 'trigger-dev-mobile-preferences',
});
