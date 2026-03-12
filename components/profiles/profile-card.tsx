import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Check, Trash2, Pencil } from 'lucide-react-native';

interface ProfileCardProps {
  name: string;
  email: string | null;
  maskedKey: string;
  isActive: boolean;
  onPress: () => void;
  onDelete: () => void;
  onRename: () => void;
}

export const ProfileCard = React.memo(function ProfileCard({
  name,
  email,
  maskedKey,
  isActive,
  onPress,
  onDelete,
  onRename,
}: ProfileCardProps) {
  return (
    <Pressable onPress={onPress} className="active:opacity-80">
      <View
        className="bg-card border-border mx-4 mb-2 rounded-lg border py-3 px-4 flex-row items-center"
        style={isActive ? { borderLeftWidth: 4, borderLeftColor: '#22C55E' } : undefined}
      >
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-mobile-secondary font-semibold text-foreground" numberOfLines={1}>
              {name}
            </Text>
            {isActive && <Check size={16} color="#22C55E" />}
          </View>
          {email && (
            <Text className="text-mobile-caption text-muted-foreground mb-0.5" numberOfLines={1}>
              {email}
            </Text>
          )}
          <Text className="text-mobile-caption text-muted-foreground" numberOfLines={1}>
            {maskedKey}
          </Text>
        </View>

        <View className="flex-row items-center gap-3 ml-2">
          <Pressable onPress={onRename} hitSlop={12} accessibilityLabel={`Rename ${name}`}>
            <Pencil size={20} color="#8B95A5" />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={12} accessibilityLabel={`Delete ${name}`}>
            <Trash2 size={20} color="#EF4444" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
});
