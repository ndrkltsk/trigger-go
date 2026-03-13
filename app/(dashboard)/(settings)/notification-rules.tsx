import { useState, useCallback, useRef } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { ContentContainer } from '@/components/layout';
import { Stack } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { ConfirmSheet, type ConfirmSheetRef } from '@/components/shared/confirm-sheet';
import { RuleFormSheet } from '@/components/notifications/rule-form-sheet';
import { RuleListItem } from '@/components/notifications/rule-list-item';
import {
  useNotificationRulesStore,
  type NotificationRule,
} from '@/stores/notification-rules-store';
import type { BottomSheetRef } from '@/components/ui/bottom-sheet/bottom-sheet';

export default function NotificationRulesScreen() {
  const { rules, toggleRule, deleteRule } = useNotificationRulesStore();

  const formSheetRef = useRef<BottomSheetRef>(null);
  const deleteSheetRef = useRef<ConfirmSheetRef>(null);
  const [editRule, setEditRule] = useState<NotificationRule | null>(null);
  const deleteTargetRef = useRef<NotificationRule | null>(null);

  const handleEdit = useCallback((rule: NotificationRule) => {
    setEditRule(rule);
    setTimeout(() => formSheetRef.current?.present(), 0);
  }, []);

  const handleCreate = useCallback(() => {
    setEditRule(null);
    setTimeout(() => formSheetRef.current?.present(), 0);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteTargetRef.current) {
      deleteRule(deleteTargetRef.current.id);
      deleteSheetRef.current?.dismiss();
    }
  }, [deleteRule]);

  const renderItem = useCallback(
    ({ item }: { item: NotificationRule }) => (
      <ContentContainer variant="reading">
        <RuleListItem
          rule={item}
          onToggle={() => toggleRule(item.id)}
          onEdit={() => handleEdit(item)}
          onDelete={() => {
            deleteTargetRef.current = item;
            deleteSheetRef.current?.present({
              description: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
            });
          }}
        />
      </ContentContainer>
    ),
    [toggleRule, handleEdit]
  );

  const renderSeparator = useCallback(
    () => <View className="border-border border-t mx-4" />,
    []
  );

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: 'Notification Rules',
          headerRight: () => (
            <Pressable onPress={handleCreate} className="p-2">
              <Plus size={20} color="#8B95A5" />
            </Pressable>
          ),
        }}
      />

      <FlatList
        data={rules}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={renderSeparator}
        contentContainerStyle={
          rules.length === 0
            ? { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }
            : { paddingBottom: 24 }
        }
        ListEmptyComponent={
          <View className="items-center">
            <Text className="text-base font-semibold text-foreground mb-1">
              No custom rules
            </Text>
            <Text className="text-sm text-muted-foreground text-center">
              Create rules to get notified about specific tasks, tags, or schedules.
            </Text>
          </View>
        }
      />

      <RuleFormSheet
        ref={formSheetRef}
        editRule={editRule}
      />

      <ConfirmSheet
        ref={deleteSheetRef}
        title="Delete Rule"
        description="Are you sure you want to delete this rule? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </View>
  );
}
