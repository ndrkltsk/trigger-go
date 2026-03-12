import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Layers, CalendarClock, Tag, Star } from 'lucide-react-native';
import { useFavoritesStore, type FavoriteItem, type FavoriteType } from '@/stores/favorites-store';

const TYPE_CONFIG: Record<FavoriteType, { icon: typeof Layers; label: string }> = {
  task: { icon: Layers, label: 'Task' },
  schedule: { icon: CalendarClock, label: 'Schedule' },
  'tag-filter': { icon: Tag, label: 'Tag' },
};

function FavoriteRow({ item, onPress }: { item: FavoriteItem; onPress: () => void }) {
  const config = TYPE_CONFIG[item.type];

  return (
    <Pressable onPress={onPress} className="flex-row items-center px-4 py-3 active:opacity-70">
      <Icon as={config.icon} size={20} className="text-muted-foreground mr-3" />
      <Text className="flex-1 text-mobile-secondary text-foreground" numberOfLines={1}>
        {item.name}
      </Text>
      <Badge variant="outline" className="px-1.5 py-0">
        <Text className="text-[10px] text-muted-foreground">{config.label}</Text>
      </Badge>
    </Pressable>
  );
}

export function FavoritesSection() {
  const favorites = useFavoritesStore((s) => s.favorites);
  const router = useRouter();

  if (favorites.length === 0) return null;

  const handlePress = (item: FavoriteItem) => {
    switch (item.type) {
      case 'schedule':
        router.push(`/(dashboard)/(settings)/schedule/${item.id}`);
        break;
      case 'task':
        router.push(`/(dashboard)/(tasks)/${item.id}`);
        break;
      case 'tag-filter':
        router.push('/(dashboard)/(runs)');
        break;
    }
  };

  return (
    <View className="mb-4">
      <View className="flex-row items-center gap-2 px-4 mb-2">
        <Star size={16} color="#f59e0b" fill="#f59e0b" />
        <Text className="text-mobile-body font-semibold text-foreground">Favorites</Text>
      </View>
      <Card className="mx-4 py-0 overflow-hidden">
        {favorites.map((item) => (
          <FavoriteRow
            key={item.id}
            item={item}
            onPress={() => handlePress(item)}
          />
        ))}
      </Card>
    </View>
  );
}
