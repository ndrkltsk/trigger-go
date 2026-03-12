import React from 'react';
import { Pressable, View } from 'react-native';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { getDeploymentStatusConfig } from '@/lib/status-colors';
import { formatRelativeTime } from '@/lib/format';
import { Rocket, Hash } from 'lucide-react-native';
import type { DeploymentListItem } from '@/services/api/deployments';

interface DeploymentCardProps {
  deployment: DeploymentListItem;
  onPress?: (deployment: DeploymentListItem) => void;
}

export const DeploymentCard = React.memo(function DeploymentCard({
  deployment,
  onPress,
}: DeploymentCardProps) {
  const config = getDeploymentStatusConfig(deployment.status ?? '');

  const versionLabel = deployment.version || deployment.shortCode || deployment.id || 'Deployment';
  const a11yLabel = `Deployment ${versionLabel}, status ${config.label}`;

  return (
    <Pressable
      onPress={() => onPress?.(deployment)}
      className="active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint="Double tap to view deployment details"
    >
      <Card className="gap-2 py-3 px-3">
        {/* Top row: version + status badge */}
        <View className="flex-row items-center gap-2">
          <Icon as={Rocket} size={20} className="text-muted-foreground" importantForAccessibility="no" />
          <Text className="font-bold text-sm text-foreground" numberOfLines={1}>
            {deployment.version || deployment.shortCode || deployment.id || 'Deployment'}
          </Text>
          <View className="flex-1" />
          <Badge
            className={`${config.bgClass} border-transparent`}
          >
            <Text className="text-mobile-caption font-semibold" style={{ color: config.color }}>
              {config.label}
            </Text>
          </Badge>
        </View>

        {/* Bottom row: short code + relative time */}
        <View className="flex-row items-center gap-2 flex-wrap">
          {deployment.shortCode && (
            <View className="flex-row items-center gap-1">
              <Icon as={Hash} size={12} className="text-muted-foreground" importantForAccessibility="no" />
              <Text className="text-mobile-caption text-muted-foreground">
                {deployment.shortCode}
              </Text>
            </View>
          )}
          {deployment.createdAt && (
            <Text className="text-mobile-caption text-muted-foreground">
              {formatRelativeTime(deployment.createdAt)}
            </Text>
          )}
        </View>
      </Card>
    </Pressable>
  );
});
