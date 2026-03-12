import { create } from 'zustand';
import { storage } from '@/lib/storage';

const STORAGE_KEY = 'recentSearches';
const MAX_RECENT = 5;

interface SearchState {
  searchQuery: string;
  submittedQuery: string;
  setSearchQuery: (query: string) => void;
  submitSearch: () => void;
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  loadRecentSearches: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  searchQuery: '',
  submittedQuery: '',
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    if (!query.trim()) {
      set({ submittedQuery: '' });
    }
  },
  submitSearch: () => {
    const query = get().searchQuery.trim();
    if (query.length < 2) return;
    set({ submittedQuery: query });
    get().addRecentSearch(query);
  },
  recentSearches: [],

  addRecentSearch: (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const current = get().recentSearches.filter((s) => s !== trimmed);
    const updated = [trimmed, ...current].slice(0, MAX_RECENT);
    storage.set(STORAGE_KEY, JSON.stringify(updated));
    set({ recentSearches: updated });
  },

  clearRecentSearches: () => {
    storage.remove(STORAGE_KEY);
    set({ recentSearches: [] });
  },

  loadRecentSearches: () => {
    const json = storage.getString(STORAGE_KEY);
    if (json) {
      try {
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed)) {
          set({ recentSearches: parsed.slice(0, MAX_RECENT) });
        }
      } catch {
        // ignore corrupt data
      }
    }
  },
}));
