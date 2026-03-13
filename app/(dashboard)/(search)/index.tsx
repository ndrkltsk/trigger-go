import { useEffect, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, Trash2 } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { SearchResultItem } from '@/components/shared/search-result-item';
import { RunStatusBadge } from '@/components/runs/run-status-badge';
import { ContentContainer } from '@/components/layout';
import { useGlobalSearch } from '@/hooks/use-global-search';
import { useSearchStore } from '@/stores/search-store';
import { formatRelativeTime } from '@/lib/format';

export default function SearchScreen() {
  const router = useRouter();
  const setQuery = useSearchStore((s) => s.setSearchQuery);
  const submittedQuery = useSearchStore((s) => s.submittedQuery);
  const submitSearch = useSearchStore((s) => s.submitSearch);
  const { runs, tasks, schedules, isLoading, isEmpty } = useGlobalSearch(submittedQuery);
  const { recentSearches, clearRecentSearches, loadRecentSearches } =
    useSearchStore();

  useEffect(() => {
    loadRecentSearches();
  }, [loadRecentSearches]);

  const navigate = useCallback(
    (path: string) => {
      router.push(path as any);
    },
    [router]
  );

  const showRecent = !submittedQuery && recentSearches.length > 0;
  const showResults = submittedQuery.length >= 2;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <ContentContainer variant="reading">
      {showRecent && (
        <View className="mt-2">
          <View className="flex-row items-center justify-between px-4 py-2">
            <Text className="text-mobile-tab font-semibold text-muted-foreground uppercase tracking-wide">
              Recent Searches
            </Text>
            <Pressable onPress={clearRecentSearches} hitSlop={12}>
              <Icon as={Trash2} size={16} className="text-muted-foreground" />
            </Pressable>
          </View>
          {recentSearches.map((search) => (
            <Pressable
              key={search}
              onPress={() => {
                setQuery(search);
                submitSearch();
              }}
              className="flex-row items-center px-4 py-2.5 active:bg-muted/50"
            >
              <Icon as={Clock} size={16} className="text-muted-foreground mr-3" />
              <Text className="text-mobile-secondary text-foreground">{search}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {showResults && isLoading && (
        <View className="items-center py-12">
          <ActivityIndicator size="small" />
          <Text className="text-mobile-caption text-muted-foreground mt-2">Searching...</Text>
        </View>
      )}

      {showResults && isEmpty && (
        <View className="items-center py-12">
          <Text className="text-mobile-secondary text-muted-foreground">
            No results for &apos;{submittedQuery}&apos;
          </Text>
        </View>
      )}

      {showResults && !isLoading && !isEmpty && (
        <>
          {runs.length > 0 && (
            <View className="mt-2">
              <Text className="text-mobile-tab font-semibold text-muted-foreground uppercase tracking-wide px-4 py-2">
                Runs ({runs.length})
              </Text>
              {runs.slice(0, 10).map((run) => (
                <SearchResultItem
                  key={run.id}
                  type="run"
                  title={run.id}
                  subtitle={`${run.taskIdentifier} - ${formatRelativeTime(run.createdAt)}`}
                  statusBadge={<RunStatusBadge status={run.status} />}
                  onPress={() => navigate(`/(dashboard)/(runs)/${run.id}`)}
                />
              ))}
            </View>
          )}

          {tasks.length > 0 && (
            <View className="mt-2">
              <Text className="text-mobile-tab font-semibold text-muted-foreground uppercase tracking-wide px-4 py-2">
                Tasks ({tasks.length})
              </Text>
              {tasks.slice(0, 10).map((task) => (
                <SearchResultItem
                  key={task}
                  type="task"
                  title={task}
                  onPress={() => navigate(`/(dashboard)/(tasks)/${task}`)}
                />
              ))}
            </View>
          )}

          {schedules.length > 0 && (
            <View className="mt-2">
              <Text className="text-mobile-tab font-semibold text-muted-foreground uppercase tracking-wide px-4 py-2">
                Schedules ({schedules.length})
              </Text>
              {schedules.slice(0, 10).map((schedule) => (
                <SearchResultItem
                  key={schedule.id}
                  type="schedule"
                  title={schedule.task ?? 'Unknown'}
                  subtitle={schedule.externalId ?? schedule.id ?? 'Unknown'}
                  onPress={() => navigate(`/(dashboard)/(settings)/schedule/${schedule.id}`)}
                />
              ))}
            </View>
          )}
        </>
      )}
      </ContentContainer>
    </ScrollView>
  );
}
