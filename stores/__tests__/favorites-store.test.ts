import { useFavoritesStore, isFavorite, favoriteCount, type FavoriteItem } from '@/stores/favorites-store';

const initialState = useFavoritesStore.getState();

beforeEach(() => {
  useFavoritesStore.setState(initialState);
  useFavoritesStore.setState({ favorites: [] });
});

function makeFavorite(id: string, type: FavoriteItem['type'] = 'schedule'): FavoriteItem {
  return { id, type, name: `Item ${id}` };
}

describe('favorites store', () => {
  it('starts with empty favorites', () => {
    expect(useFavoritesStore.getState().favorites).toEqual([]);
    expect(favoriteCount()).toBe(0);
  });

  it('addFavorite adds an item', () => {
    const result = useFavoritesStore.getState().addFavorite(makeFavorite('sched_1'));
    expect(result).toBe(true);
    expect(useFavoritesStore.getState().favorites).toHaveLength(1);
    expect(favoriteCount()).toBe(1);
  });

  it('addFavorite prevents duplicates', () => {
    useFavoritesStore.getState().addFavorite(makeFavorite('sched_1'));
    useFavoritesStore.getState().addFavorite(makeFavorite('sched_1'));
    expect(useFavoritesStore.getState().favorites).toHaveLength(1);
  });

  it('addFavorite enforces max 10 limit', () => {
    for (let i = 0; i < 10; i++) {
      useFavoritesStore.getState().addFavorite(makeFavorite(`item_${i}`));
    }
    expect(favoriteCount()).toBe(10);

    const result = useFavoritesStore.getState().addFavorite(makeFavorite('item_overflow'));
    expect(result).toBe(false);
    expect(favoriteCount()).toBe(10);
  });

  it('removeFavorite removes an item', () => {
    useFavoritesStore.getState().addFavorite(makeFavorite('sched_1'));
    useFavoritesStore.getState().addFavorite(makeFavorite('sched_2'));
    useFavoritesStore.getState().removeFavorite('sched_1');
    expect(useFavoritesStore.getState().favorites).toHaveLength(1);
    expect(useFavoritesStore.getState().favorites[0].id).toBe('sched_2');
  });

  it('isFavorite returns correct boolean', () => {
    useFavoritesStore.getState().addFavorite(makeFavorite('sched_1'));
    expect(useFavoritesStore.getState().isFavorite('sched_1')).toBe(true);
    expect(useFavoritesStore.getState().isFavorite('sched_2')).toBe(false);
    expect(isFavorite('sched_1')).toBe(true);
  });

  it('reorderFavorites replaces the list', () => {
    const items = [makeFavorite('b'), makeFavorite('a')];
    useFavoritesStore.getState().reorderFavorites(items);
    expect(useFavoritesStore.getState().favorites[0].id).toBe('b');
    expect(useFavoritesStore.getState().favorites[1].id).toBe('a');
  });

  it('stores meta on favorites', () => {
    useFavoritesStore.getState().addFavorite({
      id: 'sched_1',
      type: 'schedule',
      name: 'My Schedule',
      meta: { scheduleId: 'sched_1' },
    });
    expect(useFavoritesStore.getState().favorites[0].meta).toEqual({ scheduleId: 'sched_1' });
  });
});
