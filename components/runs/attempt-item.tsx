import React from 'react';
import { ScrollView, View } from 'react-native';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { formatDuration, formatDateTime } from '@/lib/format';
import { format } from 'date-fns';
import {
  CheckCircle,
  XOctagon,
  Clock,
  Loader,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react-native';
import type { SpanSummary } from '@/services/api/runs';

const STATUS_ICON_MAP = {
  completed: { icon: CheckCircle, color: '#22C55E' },
  failed: { icon: XOctagon, color: '#EF4444' },
  executing: { icon: Loader, color: '#3B82F6' },
  pending: { icon: Clock, color: '#8B95A5' },
} as const;

function getAttemptStatus(span: SpanSummary): keyof typeof STATUS_ICON_MAP {
  if (span.data.isError) return 'failed';
  if (span.data.isPartial) return 'executing';
  return 'completed';
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'completed': return 'Completed';
    case 'failed': return 'Failed';
    case 'executing': return 'Running';
    case 'pending': return 'Pending';
    default: return status;
  }
}

interface AttemptItemProps {
  span: SpanSummary;
  attemptNumber: number;
  isLatest: boolean;
}

export const AttemptItem = React.memo(function AttemptItem({
  span,
  attemptNumber,
  isLatest,
}: AttemptItemProps) {
  const status = getAttemptStatus(span);
  const statusConfig = STATUS_ICON_MAP[status] ?? STATUS_ICON_MAP.pending;
  const statusLabel = getStatusLabel(status);

  const startTime = span.data.startTime;
  // Trace API returns duration in nanoseconds
  const durationMs = span.data.duration / 1_000_000;
  const startTimeFormatted = startTime ? format(new Date(startTime), 'h:mm a') : '--';

  const borderColor = status === 'failed' ? '#EF4444' : status === 'completed' ? '#22C55E' : '#8B95A5';

  // Extract error events from span events
  const errorEvents = span.data.events.filter(
    (e) => e.name === 'exception' || e.name === 'error'
  );

  // The trace API nests exception details as: properties.exception.{type,message,stacktrace}
  const exceptionObj = errorEvents[0]?.properties?.exception as
    | { type?: string; message?: string; stacktrace?: string }
    | undefined;

  const errorMessage = exceptionObj?.message
    ?? (errorEvents[0]?.properties?.['exception.message'] as string | undefined)
    ?? (span.data.properties?.error as string | undefined);
  const errorName = exceptionObj?.type
    ?? (errorEvents[0]?.properties?.['exception.type'] as string | undefined);
  const stackTrace = exceptionObj?.stacktrace
    ?? (errorEvents[0]?.properties?.['exception.stacktrace'] as string | undefined);

  return (
    <AccordionItem
      value={span.id}
      style={{ borderLeftWidth: 3, borderLeftColor: borderColor }}
      className="border-b-0 mb-2 rounded-lg bg-card px-3"
    >
      <AccordionTrigger className="py-3">
        <View className="flex-1 flex-row items-center gap-2 flex-wrap">
          <Icon as={statusConfig.icon} size={16} color={statusConfig.color} />
          <Text variant="small" className="font-semibold">
            Attempt #{attemptNumber}
          </Text>
          <Text variant="muted" className="text-xs">
            {statusLabel}
          </Text>
          <Text variant="muted" className="text-xs">
            {startTimeFormatted}
          </Text>
          {durationMs != null && durationMs > 0 && (
            <Text variant="muted" className="text-xs">
              {formatDuration(durationMs)}
            </Text>
          )}
          {isLatest && (
            <Badge variant="secondary" className="px-1.5 py-0">
              <Text className="text-xs text-muted-foreground">Latest</Text>
            </Badge>
          )}
        </View>
      </AccordionTrigger>

      <AccordionContent className="px-1 pb-3">
        {status === 'failed' && errorMessage ? (
          <View className="gap-2">
            {errorName && (
              <Text variant="small" className="font-bold text-status-failed">
                {errorName}
              </Text>
            )}
            <Text variant="muted">{errorMessage}</Text>
            {stackTrace && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="self-start">
                    <Icon as={ChevronDown} size={14} className="text-muted-foreground" />
                    <Text variant="muted" className="text-xs">
                      Stack trace
                    </Text>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ScrollView
                    horizontal
                    className="mt-2 rounded bg-muted p-2"
                    style={{ maxHeight: 200 }}
                  >
                    <Text className="text-xs font-mono text-foreground">
                      {stackTrace}
                    </Text>
                  </ScrollView>
                </CollapsibleContent>
              </Collapsible>
            )}
          </View>
        ) : status === 'failed' ? (
          <View className="flex-row items-center gap-2">
            <Icon as={AlertTriangle} size={16} color="#EF4444" />
            <Text variant="muted">Attempt failed</Text>
          </View>
        ) : status === 'completed' ? (
          <View className="flex-row items-center gap-2">
            <Icon as={CheckCircle} size={16} color="#22C55E" />
            <Text variant="muted">Completed successfully</Text>
          </View>
        ) : (
          <Text variant="muted">Attempt is {statusLabel.toLowerCase()}</Text>
        )}

        <View className="mt-3 gap-1">
          {startTime && (
            <Text variant="muted" className="text-xs">
              Started: {formatDateTime(startTime)}
            </Text>
          )}
          {durationMs != null && durationMs > 0 && startTime && (
            <Text variant="muted" className="text-xs">
              Ended: {formatDateTime(new Date(new Date(startTime).getTime() + durationMs).toISOString())}
            </Text>
          )}
          {durationMs != null && durationMs > 0 && (
            <Text variant="muted" className="text-xs">
              Duration: {formatDuration(durationMs)}
            </Text>
          )}
        </View>

        {/* Show sub-events (retry delays, etc.) */}
        {span.data.events.length > 0 && (
          <View className="mt-3 gap-1">
            <Text variant="muted" className="text-xs font-semibold">Events</Text>
            {span.data.events
              .filter((e) => e.name !== 'exception' && e.name !== 'error')
              .map((event, i) => (
                <View key={i} className="flex-row items-center gap-2">
                  <View className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  <Text variant="muted" className="text-xs">
                    {event.name}
                    {event.time ? ` at ${format(new Date(event.time), 'h:mm:ss a')}` : ''}
                  </Text>
                </View>
              ))}
          </View>
        )}
      </AccordionContent>
    </AccordionItem>
  );
});
