import React from 'react';
import { Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Star } from 'lucide-react-native';
import { useFavoritesStore, type FavoriteType } from '@/stores/favorites-store';
import { useToast } from '@/stores/toast-store';

interface FavoriteButtonProps {
  itemId: string;
  itemType: FavoriteType;
  itemName: string;
  meta?: Record<string, string>;
}

export function FavoriteButton({ itemId, itemType, itemName, meta }: FavoriteButtonProps) {
  const isFav = useFavoritesStore((s) => s.favorites.some((f) => f.id === itemId));
  const addFavorite = useFavoritesStore((s) => s.addFavorite);
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);
  const { showToast } = useToast();

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isFav) {
      removeFavorite(itemId);
    } else {
      const added = addFavorite({ id: itemId, type: itemType, name: itemName, meta });
      if (!added) {
        showToast({ type: 'warning', title: 'Maximum 10 favorites' });
      }
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={12}
      accessibilityLabel={isFav ? `Unpin ${itemName}` : `Pin ${itemName}`}
      accessibilityRole="button"
      className="active:opacity-60"
    >
      <Star
        size={20}
        color={isFav ? '#f59e0b' : '#a1a1aa'}
        fill={isFav ? '#f59e0b' : 'transparent'}
      />
    </Pressable>
  );
}
