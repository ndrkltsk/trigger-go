import { useSearchStore } from '@/stores/search-store';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

beforeEach(() => {
  useSearchStore.setState({ searchQuery: '', submittedQuery: '', recentSearches: [] });
});

describe('useSearchStore', () => {
  it('starts with empty recent searches', () => {
    expect(useSearchStore.getState().recentSearches).toEqual([]);
  });

  it('adds a recent search', () => {
    useSearchStore.getState().addRecentSearch('my-task');
    expect(useSearchStore.getState().recentSearches).toEqual(['my-task']);
  });

  it('adds to the front', () => {
    useSearchStore.getState().addRecentSearch('first');
    useSearchStore.getState().addRecentSearch('second');
    expect(useSearchStore.getState().recentSearches).toEqual(['second', 'first']);
  });

  it('deduplicates', () => {
    useSearchStore.getState().addRecentSearch('first');
    useSearchStore.getState().addRecentSearch('second');
    useSearchStore.getState().addRecentSearch('first');
    expect(useSearchStore.getState().recentSearches).toEqual(['first', 'second']);
  });

  it('limits to 5 items', () => {
    for (let i = 1; i <= 7; i++) {
      useSearchStore.getState().addRecentSearch(`search-${i}`);
    }
    const searches = useSearchStore.getState().recentSearches;
    expect(searches).toHaveLength(5);
    expect(searches[0]).toBe('search-7');
    expect(searches[4]).toBe('search-3');
  });

  it('ignores empty strings', () => {
    useSearchStore.getState().addRecentSearch('');
    useSearchStore.getState().addRecentSearch('  ');
    expect(useSearchStore.getState().recentSearches).toEqual([]);
  });

  it('clears recent searches', () => {
    useSearchStore.getState().addRecentSearch('test');
    useSearchStore.getState().clearRecentSearches();
    expect(useSearchStore.getState().recentSearches).toEqual([]);
  });

  it('submitSearch sets submittedQuery and adds to recent searches', () => {
    useSearchStore.getState().setSearchQuery('my-task');
    useSearchStore.getState().submitSearch();
    expect(useSearchStore.getState().submittedQuery).toBe('my-task');
    expect(useSearchStore.getState().recentSearches).toEqual(['my-task']);
  });

  it('submitSearch ignores queries shorter than 2 characters', () => {
    useSearchStore.getState().setSearchQuery('a');
    useSearchStore.getState().submitSearch();
    expect(useSearchStore.getState().submittedQuery).toBe('');
    expect(useSearchStore.getState().recentSearches).toEqual([]);
  });

  it('clearing search query resets submittedQuery', () => {
    useSearchStore.getState().setSearchQuery('my-task');
    useSearchStore.getState().submitSearch();
    expect(useSearchStore.getState().submittedQuery).toBe('my-task');
    useSearchStore.getState().setSearchQuery('');
    expect(useSearchStore.getState().submittedQuery).toBe('');
  });
});
