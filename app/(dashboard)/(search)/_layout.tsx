import { Stack } from 'expo-router';
import { useSearchStore } from '@/stores/search-store';

export default function SearchLayout() {
  const setSearchQuery = useSearchStore((s) => s.setSearchQuery);
  const submitSearch = useSearchStore((s) => s.submitSearch);

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: '',
          headerTransparent: true,
          headerShadowVisible: false,
          headerSearchBarOptions: {
            placeholder: 'Search runs, tasks, schedules...',
            onChangeText: (e: { nativeEvent: { text: string } }) =>
              setSearchQuery(e.nativeEvent.text),
            onSearchButtonPress: () => submitSearch(),
            autoCapitalize: 'none',
            hideWhenScrolling: false,
          },
        }}
      />
    </Stack>
  );
}
