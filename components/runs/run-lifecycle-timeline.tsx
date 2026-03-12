import React, { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { TimelineNodeComponent } from './timeline-node';
import { buildTimeline, type RunTimeline } from '@/lib/timeline';
import { getStatusConfig } from '@/lib/status-colors';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import type { RetrieveRunResponse, TraceResponse } from '@/services/api/runs';

interface RunLifecycleTimelineProps {
  run: RetrieveRunResponse;
  traceData: TraceResponse | null;
}

export function RunLifecycleTimeline({ run, traceData }: RunLifecycleTimelineProps) {
  const timeline = useMemo(() => buildTimeline(run, traceData), [run, traceData]);
  const [expandedChildren, setExpandedChildren] = useState<Set<string>>(new Set());

  const toggleChild = (childId: string) => {
    setExpandedChildren((prev) => {
      const next = new Set(prev);
      if (next.has(childId)) {
        next.delete(childId);
      } else {
        next.add(childId);
      }
      return next;
    });
  };

  return (
    <View className="px-4 py-3">
      <Text className="text-sm font-semibold text-foreground mb-3">Timeline</Text>

      {/* Main timeline */}
      {timeline.nodes.map((node, index) => (
        <TimelineNodeComponent
          key={node.id}
          node={node}
          isLast={index === timeline.nodes.length - 1 && timeline.childTimelines.length === 0}
        />
      ))}

      {/* Child run timelines */}
      {timeline.childTimelines.length > 0 && (
        <View className="mt-2">
          <Text className="text-xs font-semibold text-muted-foreground mb-2">
            Child Runs ({timeline.childTimelines.length})
          </Text>
          {timeline.childTimelines.map((child) => {
            const expanded = expandedChildren.has(child.run.id);
            const statusConfig = getStatusConfig(child.run.status);

            return (
              <View key={child.run.id} className="mb-2">
                <Pressable
                  onPress={() => toggleChild(child.run.id)}
                  className="flex-row items-center gap-2 py-1 active:opacity-70"
                >
                  {expanded ? (
                    <ChevronDown size={14} color="#8B95A5" />
                  ) : (
                    <ChevronRight size={14} color="#8B95A5" />
                  )}
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: statusConfig.color,
                    }}
                  />
                  <Text className="text-xs text-foreground" numberOfLines={1}>
                    {child.run.taskIdentifier}
                  </Text>
                  <Text className="text-xs text-muted-foreground">{statusConfig.label}</Text>
                </Pressable>

                {expanded && (
                  <View className="ml-6 border-l border-border pl-3 mt-1">
                    {child.nodes.map((node, index) => (
                      <TimelineNodeComponent
                        key={node.id}
                        node={node}
                        isLast={index === child.nodes.length - 1}
                      />
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
