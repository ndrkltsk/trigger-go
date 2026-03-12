import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';

export function RunCardSkeleton() {
  return (
    <View className="bg-card border-border mx-4 mb-2 rounded-lg border py-3 pl-4 pr-3" style={{ borderLeftWidth: 4, borderLeftColor: '#8B95A5' }}>
      {/* Top row: task name */}
      <Skeleton className="h-4 w-40 mb-2" />

      {/* Middle row: run ID + badge + time */}
      <View className="flex-row items-center gap-2 mb-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </View>

      {/* Duration */}
      <Skeleton className="h-3 w-12 mt-1" />
    </View>
  );
}

export function RunCardSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View className="pt-2">
      {Array.from({ length: count }, (_, i) => (
        <RunCardSkeleton key={i} />
      ))}
    </View>
  );
}
