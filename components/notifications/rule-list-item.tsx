import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, Trash2 } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import type { NotificationRule } from '@/stores/notification-rules-store';

interface RuleListItemProps {
  rule: NotificationRule;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function getTriggerDescription(rule: NotificationRule): string {
  const typeLabel = rule.triggerType === 'task' ? 'task' : rule.triggerType === 'tag' ? 'tag' : 'schedule';
  const eventLabel = rule.eventType === 'failure' ? 'fails' : rule.eventType === 'completion' ? 'completes' : 'runs';
  return `When ${typeLabel} "${rule.triggerValue}" ${eventLabel}`;
}

export function RuleListItem({ rule, onToggle, onEdit, onDelete }: RuleListItemProps) {
  const triggerDesc = getTriggerDescription(rule);
  const severityLabel = rule.severity === 'high' ? ', high severity' : '';
  const enabledLabel = rule.enabled ? 'enabled' : 'disabled';

  return (
    <Pressable
      onPress={onEdit}
      className="px-4 py-3 active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={`${rule.name}, ${triggerDesc}${severityLabel}, ${enabledLabel}`}
      accessibilityHint="Double tap to edit rule"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-mobile-secondary font-medium text-foreground" numberOfLines={1}>
              {rule.name}
            </Text>
            {rule.severity === 'high' && (
              <AlertTriangle size={16} color="#f59e0b" accessibilityLabel="High severity" />
            )}
          </View>
          <Text className="text-mobile-caption text-muted-foreground mt-0.5" numberOfLines={1}>
            {getTriggerDescription(rule)}
          </Text>
          <View className="flex-row items-center gap-2 mt-1">
            {rule.environment !== 'any' && (
              <View className="bg-primary/10 px-1.5 py-0.5 rounded">
                <Text className="text-[10px] font-semibold text-primary">{rule.environment}</Text>
              </View>
            )}
            <View className="bg-muted px-1.5 py-0.5 rounded">
              <Text className="text-[10px] text-muted-foreground">{rule.eventType}</Text>
            </View>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onPress={(e) => {
              e.stopPropagation?.();
              onDelete();
            }}
            accessibilityLabel={`Delete rule ${rule.name}`}
            accessibilityRole="button"
          >
            <Trash2 size={16} color="#ef4444" />
          </Button>
          <Switch
            checked={rule.enabled}
            onCheckedChange={onToggle}
            accessibilityLabel={`${rule.enabled ? 'Disable' : 'Enable'} rule ${rule.name}`}
          />
        </View>
      </View>
    </Pressable>
  );
}
