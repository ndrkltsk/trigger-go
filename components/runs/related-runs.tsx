import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { RunStatusBadge } from './run-status-badge';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import type { CommonRunObject } from '@/services/api/runs';

interface RelatedRunsProps {
  relatedRuns?: {
    root?: CommonRunObject;
    parent?: CommonRunObject;
    children?: CommonRunObject[];
  };
}

const MAX_CHILDREN_VISIBLE = 5;

function RelatedRunRow({ run }: { run: CommonRunObject }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/(dashboard)/(runs)/${run.id}`)}
      className="flex-row items-center justify-between py-2 px-3 rounded-lg active:bg-muted/50"
    >
      <View className="flex-1 mr-2">
        <Text className="text-mobile-secondary text-foreground" numberOfLines={1}>
          {run.taskIdentifier}
        </Text>
        <Text className="text-mobile-caption text-muted-foreground">{run.id}</Text>
      </View>
      <RunStatusBadge status={run.status} />
    </Pressable>
  );
}

export function RelatedRuns({ relatedRuns }: RelatedRunsProps) {
  const [showAllChildren, setShowAllChildren] = useState(false);

  if (!relatedRuns) return null;

  const { root, parent, children } = relatedRuns;
  const hasAny = root || parent || (children && children.length > 0);

  if (!hasAny) return null;

  const visibleChildren =
    children && children.length > MAX_CHILDREN_VISIBLE && !showAllChildren
      ? children.slice(0, MAX_CHILDREN_VISIBLE)
      : children;

  return (
    <View className="px-4 py-3">
      <Text className="text-mobile-body font-semibold text-foreground mb-2">Related Runs</Text>

      {root && (
        <View className="mb-2">
          <Text className="text-mobile-caption text-muted-foreground mb-1 px-3">Root Run</Text>
          <RelatedRunRow run={root} />
        </View>
      )}

      {parent && (
        <View className="mb-2">
          <Text className="text-mobile-caption text-muted-foreground mb-1 px-3">Parent Run</Text>
          <RelatedRunRow run={parent} />
        </View>
      )}

      {children && children.length > 0 && (
        <View>
          <Text className="text-mobile-caption text-muted-foreground mb-1 px-3">
            Child Runs ({children.length})
          </Text>
          {visibleChildren?.map((child) => (
            <RelatedRunRow key={child.id} run={child} />
          ))}
          {children.length > MAX_CHILDREN_VISIBLE && (
            <Pressable
              onPress={() => setShowAllChildren(!showAllChildren)}
              className="flex-row items-center justify-center gap-1 py-2"
            >
              {showAllChildren ? (
                <ChevronUp size={16} color="#8B95A5" />
              ) : (
                <ChevronDown size={16} color="#8B95A5" />
              )}
              <Text className="text-mobile-caption text-muted-foreground font-medium">
                {showAllChildren
                  ? 'Show less'
                  : `View all ${children.length} children`}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
