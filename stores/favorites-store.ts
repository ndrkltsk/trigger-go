import { create } from 'zustand';
import { storage } from '@/lib/storage';
import { posthogCapture } from '@/services/posthog';

const STORAGE_KEY = 'favorites';
const MAX_FAVORITES = 10;

export type FavoriteType = 'task' | 'schedule' | 'tag-filter';

export interface FavoriteItem {
  id: string;
  type: FavoriteType;
  name: string;
  meta?: Record<string, string>;
}

interface FavoritesState {
  favorites: FavoriteItem[];
  addFavorite: (item: FavoriteItem) => boolean;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  reorderFavorites: (favorites: FavoriteItem[]) => void;
  loadFavorites: () => void;
}

function persistFavorites(favorites: FavoriteItem[]) {
  storage.set(STORAGE_KEY, JSON.stringify(favorites));
}

function loadPersistedFavorites(): FavoriteItem[] {
  const raw = storage.getString(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as FavoriteItem[];
  } catch {
    return [];
  }
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],

  addFavorite: (item) => {
    const { favorites } = get();
    if (favorites.length >= MAX_FAVORITES) return false;
    if (favorites.some((f) => f.id === item.id)) return true;
    const updated = [...favorites, item];
    persistFavorites(updated);
    set({ favorites: updated });
    posthogCapture('favorite added', { type: item.type, name: item.name });
    return true;
  },

  removeFavorite: (id) => {
    const item = get().favorites.find((f) => f.id === id);
    const updated = get().favorites.filter((f) => f.id !== id);
    persistFavorites(updated);
    set({ favorites: updated });
    if (item) posthogCapture('favorite removed', { type: item.type });
  },

  isFavorite: (id) => {
    return get().favorites.some((f) => f.id === id);
  },

  reorderFavorites: (favorites) => {
    persistFavorites(favorites);
    set({ favorites });
  },

  loadFavorites: () => {
    set({ favorites: loadPersistedFavorites() });
  },
}));

export function isFavorite(id: string): boolean {
  return useFavoritesStore.getState().isFavorite(id);
}

export function favoriteCount(): number {
  return useFavoritesStore.getState().favorites.length;
}
