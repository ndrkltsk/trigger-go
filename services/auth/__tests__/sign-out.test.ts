import { signOut } from '@/services/auth/sign-out';
import { useAuthStore } from '@/stores/auth-store';
import { useFiltersStore } from '@/stores/filters-store';
import { useProjectsStore } from '@/stores/projects-store';
import { useFavoritesStore } from '@/stores/favorites-store';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockQueryClient = {
  clear: jest.fn(),
};

beforeEach(() => {
  mockQueryClient.clear.mockClear();
  // Set up some state to verify it gets cleared
  useAuthStore.setState({ isAuthenticated: true, token: 'tr_pat_test123' });
  useFiltersStore.getState().setStatusFilter(['COMPLETED']);
  useProjectsStore.setState({
    savedProjects: [{ projectRef: 'proj_1', name: 'Test' }],
  });
  useFavoritesStore.setState({
    favorites: [{ id: 'fav_1', type: 'schedule', name: 'Test Fav' }],
  });
});

describe('signOut', () => {
  it('clears query client cache', async () => {
    await signOut(mockQueryClient as any);
    expect(mockQueryClient.clear).toHaveBeenCalledTimes(1);
  });

  it('clears auth store credentials', async () => {
    await signOut(mockQueryClient as any);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
  });

  it('clears filters', async () => {
    await signOut(mockQueryClient as any);
    expect(useFiltersStore.getState().statusFilter).toEqual([]);
  });

  it('clears saved projects', async () => {
    await signOut(mockQueryClient as any);
    expect(useProjectsStore.getState().savedProjects).toEqual([]);
  });

  it('clears favorites', async () => {
    await signOut(mockQueryClient as any);
    expect(useFavoritesStore.getState().favorites).toEqual([]);
  });
});
