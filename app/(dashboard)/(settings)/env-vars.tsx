import { useState, useCallback, useRef } from 'react';
import { FlatList, View } from 'react-native';
import { Stack } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EnvVarRow } from '@/components/settings/env-var-row';
import { EnvVarForm } from '@/components/settings/env-var-form';
import { EnvVarAddSheet } from '@/components/settings/env-var-add-sheet';
import { EnvVarDeleteSheet } from '@/components/settings/env-var-delete-dialog';
import type { ConfirmSheetRef } from '@/components/shared/confirm-sheet';
import {
  useEnvVars,
  useUpdateEnvVar,
  useDeleteEnvVar,
} from '@/hooks/api/use-envvars';
import { useEnvironment } from '@/hooks/use-environment';
import { usePreferencesStore } from '@/stores/preferences-store';
import { useToast } from '@/stores/toast-store';
import { ENV_LABELS, ENV_COLORS } from '@/lib/environment';
import type { EnvVar } from '@/services/api/envvars';
import type { BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';

export default function EnvVarsScreen() {
  const { data: envVars, isLoading, isError, error, refetch } = useEnvVars();
  const { currentEnvironment, availableEnvironments, setEnvironment } = useEnvironment();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const updateMutation = useUpdateEnvVar();
  const deleteMutation = useDeleteEnvVar();
  const environment = usePreferencesStore((s) => s.selectedEnvironment);
  const { showToast } = useToast();

  const addSheetRef = useRef<BottomSheetRef>(null);
  const editFormRef = useRef<BottomSheetRef>(null);
  const [editTarget, setEditTarget] = useState<EnvVar | null>(null);
  const deleteSheetRef = useRef<ConfirmSheetRef>(null);
  const deleteTargetRef = useRef<EnvVar | null>(null);

  const handleUpdate = useCallback(
    async (name: string, value: string) => {
      try {
        await updateMutation.mutateAsync({ name, value });
        editFormRef.current?.dismiss();
        setEditTarget(null);
        showToast({ type: 'success', title: 'Variable updated' });
      } catch (err) {
        showToast({
          type: 'error',
          title: 'Failed to update variable',
          message: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    },
    [updateMutation, showToast]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTargetRef.current) return;
    try {
      await deleteMutation.mutateAsync(deleteTargetRef.current.name);
      deleteSheetRef.current?.dismiss();
      showToast({ type: 'success', title: 'Variable deleted' });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Failed to delete variable',
        message: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  }, [deleteMutation, showToast]);

  const handleEditPress = useCallback((item: EnvVar) => {
    setEditTarget(item);
    setTimeout(() => editFormRef.current?.present(), 0);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: EnvVar }) => (
      <EnvVarRow
        envVar={item}
        onEdit={() => handleEditPress(item)}
        onDelete={() => {
          deleteTargetRef.current = item;
          deleteSheetRef.current?.present({
            description: `This will permanently remove '${item.name}' from the ${environment} environment.`,
          });
        }}
      />
    ),
    [handleEditPress]
  );

  const renderSeparator = useCallback(
    () => <View className="border-border border-t mx-4" />,
    []
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <View className="px-4 py-4 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} className="gap-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-destructive text-center mb-4">
          {error?.message ?? 'Failed to load environment variables'}
        </Text>
        <Button variant="outline" onPress={() => refetch()}>
          <Text className="text-sm font-medium">Try again</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={envVars ?? []}
        keyExtractor={(item) => item.name}
        renderItem={renderItem}
        ItemSeparatorComponent={renderSeparator}
        contentInsetAdjustmentBehavior="automatic"
        onRefresh={async () => {
          setIsManualRefreshing(true);
          try {
            await refetch();
          } finally {
            setIsManualRefreshing(false);
          }
        }}
        refreshing={isManualRefreshing}
        contentContainerStyle={
          (!envVars || envVars.length === 0)
            ? { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }
            : { paddingBottom: 100 }
        }
        ListEmptyComponent={
          <View className="items-center">
            <Text className="text-base font-semibold text-foreground mb-1">
              No environment variables
            </Text>
            <Text className="text-sm text-muted-foreground text-center">
              Add variables to configure your tasks.
            </Text>
          </View>
        }
      />

      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="circle.fill" tintColor={ENV_COLORS[currentEnvironment]} separateBackground>
          {availableEnvironments.map((env) => (
            <Stack.Toolbar.MenuAction
              key={env}
              isOn={env === currentEnvironment}
              onPress={() => setEnvironment(env)}
            >
              {ENV_LABELS[env]}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
        <Stack.Toolbar.Button icon="plus" onPress={() => addSheetRef.current?.present()} separateBackground />
      </Stack.Toolbar>

      <EnvVarAddSheet ref={addSheetRef} />

      <EnvVarForm
        ref={editFormRef}
        mode="edit"
        initialName={editTarget?.name ?? ''}
        initialValue={editTarget?.value ?? ''}
        onSubmit={handleUpdate}
        isPending={updateMutation.isPending}
        onDismiss={() => setEditTarget(null)}
      />

      <EnvVarDeleteSheet
        ref={deleteSheetRef}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </View>
  );
}
