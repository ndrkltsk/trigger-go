import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View
      className="flex-1 items-center justify-center px-8 py-16"
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${description}`}
    >
      <Icon size={48} className="text-muted-foreground mb-4" color="#8B95A5" importantForAccessibility="no" />
      <Text variant="h3" className="text-center mb-2" accessibilityRole="header">
        {title}
      </Text>
      <Text className="text-[14px] tablet:text-tablet-secondary text-muted-foreground text-center mb-6">
        {description}
      </Text>
      {actionLabel && onAction && (
        <Button variant="outline" onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel}>
          <Text className="text-sm font-medium">{actionLabel}</Text>
        </Button>
      )}
    </View>
  );
}
