import React from 'react';
import { Pressable, View } from 'react-native';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';

import { cronToHuman } from '@/lib/cron';
import { formatRelativeTime, formatDateTime } from '@/lib/format';
import { Calendar, Clock } from 'lucide-react-native';
import type { ScheduleObject } from '@/services/api/schedules';

interface ScheduleCardProps {
  schedule: ScheduleObject;
  onPress?: (schedule: ScheduleObject) => void;
}

export const ScheduleCard = React.memo(function ScheduleCard({
  schedule,
  onPress,
}: ScheduleCardProps) {
  const isActive = schedule.active ?? false;
  const isDeclarative = schedule.type === 'DECLARATIVE';
  const cronExpression = schedule.generator?.expression;
  const humanDescription =
    schedule.generator?.description ?? (cronExpression ? cronToHuman(cronExpression) : null);

  const scheduleName = schedule.externalId ?? schedule.task ?? schedule.id ?? 'Schedule';
  const a11yLabel = [
    `Schedule ${scheduleName}`,
    isActive ? 'Active' : 'Inactive',
    humanDescription,
    schedule.nextRun ? `Next run ${formatRelativeTime(schedule.nextRun)}` : null,
  ].filter(Boolean).join(', ');

  return (
    <Pressable
      onPress={() => onPress?.(schedule)}
      className="active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint="Double tap to view schedule details"
    >
      <Card className="gap-2.5 py-4 px-4 rounded-md">
        {/* Title row: name + active badge */}
        <View className="flex-row items-center gap-2">
          <Icon as={Calendar} size={18} className="text-amber-500" importantForAccessibility="no" />
          <Text className="flex-1 font-bold text-base text-foreground" numberOfLines={1}>
            {scheduleName}
          </Text>
          <Badge
            variant={isActive ? 'default' : 'secondary'}
            className={isActive ? 'bg-status-success/15 border-transparent' : 'border-transparent'}
          >
            <Text className={`text-xs font-semibold ${isActive ? 'text-status-success' : 'text-muted-foreground'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </Badge>
        </View>

        {/* Human-readable schedule description */}
        {humanDescription && (
          <Text className="text-sm text-muted-foreground" numberOfLines={1}>
            {humanDescription}
          </Text>
        )}

        {/* Next run row */}
        {schedule.nextRun && (
          <View className="flex-row items-center gap-1.5">
            <Icon as={Clock} size={14} className="text-muted-foreground" importantForAccessibility="no" />
            <Text className="text-sm text-muted-foreground">
              {formatRelativeTime(schedule.nextRun)}
            </Text>
          </View>
        )}

        {/* Type badge row */}
        {isDeclarative && (
          <View>
            <Badge variant="outline" className="px-2 py-0.5 border-border self-start">
              <Text className="text-xs text-muted-foreground">
                Declarative
              </Text>
            </Badge>
          </View>
        )}
      </Card>
    </Pressable>
  );
});
