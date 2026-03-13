import React, { useCallback, useEffect, useRef } from 'react';
import { ScrollView, View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Icon } from '@/components/ui/icon';
import { ConfirmSheet, type ConfirmSheetRef } from '@/components/shared/confirm-sheet';
import { ContentContainer } from '@/components/layout';
import { getDeploymentStatusConfig } from '@/lib/status-colors';
import { useDeployment, usePromoteDeployment } from '@/hooks/api/use-deployments';
import { useToast } from '@/stores/toast-store';
import { Code, AlertTriangle, ArrowUpCircle } from 'lucide-react-native';
import { posthogCapture } from '@/services/posthog';

function MetadataRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-baseline justify-between py-1.5">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text
        className="text-xs text-foreground"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function DeploymentDetailSkeleton() {
  return (
    <View className="flex-1 bg-background">
      <View className="px-4 py-4 gap-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-64 mt-2" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-40" />
        <View className="mt-4 gap-2">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </View>
      </View>
    </View>
  );
}

export default function DeploymentDetailScreen() {
  const { deploymentId } = useLocalSearchParams<{ deploymentId: string }>();
  const { data: deployment, isLoading, isError, error, refetch } = useDeployment(deploymentId);
  const promoteMutation = usePromoteDeployment();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const promoteSheetRef = useRef<ConfirmSheetRef>(null);

  useEffect(() => {
    if (deployment) {
      posthogCapture('deployment viewed', { deployment_id: deploymentId });
    }
  }, [deploymentId, deployment]);

  const handleCopyDeploymentId = () => {
    Clipboard.setStringAsync(deploymentId);
    showToast({ type: 'success', title: 'Deployment ID copied' });
  };

  const handlePromote = useCallback(async () => {
    if (!deployment?.version) return;
    promoteSheetRef.current?.dismiss();
    try {
      await promoteMutation.mutateAsync(deployment.version);
      showToast({ type: 'success', title: 'Deployment promoted to active' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to promote deployment';
      showToast({ type: 'error', title: message });
    }
  }, [deployment?.version, promoteMutation, showToast]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <Stack.Screen options={{ title: 'Loading...' }} />
        <DeploymentDetailSkeleton />
      </View>
    );
  }

  if (isError || !deployment) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Stack.Screen options={{ title: 'Error' }} />
        <Text className="text-destructive text-center mb-4">
          {error?.message ?? 'Deployment not found'}
        </Text>
        <Button variant="outline" onPress={() => refetch()}>
          <Text className="text-sm font-medium">Try again</Text>
        </Button>
      </View>
    );
  }

  const config = getDeploymentStatusConfig(deployment.status ?? '');
  const workerTasks = deployment.worker?.tasks ?? [];

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{ title: deployment.version ?? deployment.shortCode ?? 'Deployment' }}
      />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="ellipsis">
          <Stack.Toolbar.MenuAction icon="doc.on.doc" onPress={handleCopyDeploymentId}>
            Copy Deployment ID
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      <ScrollView className="flex-1" contentInsetAdjustmentBehavior="automatic">
        <ContentContainer variant="reading">
        {/* Header */}
        <View className="px-4 tablet:px-8 py-4">
          <Text className="text-lg font-bold text-foreground mb-1">
            {deployment.version ?? deployment.shortCode ?? 'Deployment'}
          </Text>
          <View className="flex-row items-center gap-2 mb-3">
            <Badge className={`${config.bgClass} border-transparent`}>
              <Text className={`text-xs font-semibold ${config.textClass}`}>
                {config.label}
              </Text>
            </Badge>
          </View>
        </View>

        {/* Configuration card */}
        <View className="px-4 pb-3">
          <Card>
            <CardContent className="py-3">
              <View className="border-b border-border pb-2 mb-1">
                <Text className="text-sm font-semibold text-foreground">
                  Details
                </Text>
              </View>

              {deployment.id && (
                <MetadataRow label="Deployment ID" value={deployment.id} />
              )}
              {deployment.version && (
                <MetadataRow label="Version" value={deployment.version} />
              )}
              {deployment.shortCode && (
                <MetadataRow label="Short Code" value={deployment.shortCode} />
              )}
              <MetadataRow label="Status" value={config.label} />
              {deployment.contentHash && (
                <MetadataRow label="Content Hash" value={deployment.contentHash} />
              )}
            </CardContent>
          </Card>
        </View>

        {/* Error info for failed deployments */}
        {deployment.status === 'FAILED' && deployment.errorData && (
          <View className="px-4 pb-3">
            <Card>
              <CardContent className="py-3">
                <View className="flex-row items-center gap-2 border-b border-border pb-2 mb-1">
                  <Icon as={AlertTriangle} size={14} className="text-destructive" />
                  <Text className="text-sm font-semibold text-destructive">
                    Error
                  </Text>
                </View>
                <Text variant="code" className="text-xs text-muted-foreground">
                  {JSON.stringify(deployment.errorData, null, 2)}
                </Text>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Worker tasks */}
        {workerTasks.length > 0 && (
          <View className="px-4 pb-3">
            <Card>
              <CardContent className="py-3">
                <View className="border-b border-border pb-2 mb-1">
                  <Text className="text-sm font-semibold text-foreground">
                    Tasks ({workerTasks.length})
                  </Text>
                </View>
                {workerTasks.map((task, index) => (
                  <View
                    key={task.id ?? index}
                    className={`flex-row items-center gap-2 py-2 ${
                      index < workerTasks.length - 1 ? 'border-b border-border/50' : ''
                    }`}
                  >
                    <Icon as={Code} size={14} className="text-muted-foreground" />
                    <View className="flex-1">
                      <Text variant="code" className="text-xs font-bold" numberOfLines={1}>
                        {task.slug ?? task.id ?? 'Unknown task'}
                      </Text>
                      {task.filePath && (
                        <Text variant="muted" className="text-xs" numberOfLines={1}>
                          {task.filePath}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </CardContent>
            </Card>
          </View>
        )}

        </ContentContainer>
      </ScrollView>

      {/* Sticky bottom footer — only for deployed deployments */}
      {deployment.version && deployment.status === 'DEPLOYED' && (
        <View
          className="border-t border-border bg-card px-4 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <Button
            onPress={() => promoteSheetRef.current?.present()}
            disabled={promoteMutation.isPending}
            className="flex-row items-center gap-2"
          >
            {promoteMutation.isPending ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text className="text-sm font-medium text-primary-foreground">Promoting...</Text>
              </>
            ) : (
              <>
                <ArrowUpCircle size={16} color="#fff" />
                <Text className="text-sm font-medium text-primary-foreground">Promote</Text>
              </>
            )}
          </Button>
        </View>
      )}

      <ConfirmSheet
        ref={promoteSheetRef}
        title="Promote this deployment?"
        description={`This will make version ${deployment.version} the active deployment. The current latest deployment will be replaced.`}
        confirmLabel="Promote"
        variant="default"
        isPending={promoteMutation.isPending}
        onConfirm={handlePromote}
      />
    </View>
  );
}
