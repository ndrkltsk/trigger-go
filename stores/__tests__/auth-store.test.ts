import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/stores/auth-store';

// Reset the store before each test
beforeEach(() => {
  useAuthStore.setState({
    token: null,
    baseUrl: 'https://api.trigger.dev',
    projectRef: null,
    isAuthenticated: false,
    isLoading: true,
  });
  jest.clearAllMocks();
});

describe('useAuthStore', () => {
  describe('setCredentials', () => {
    it('stores token in secure store and updates state', async () => {
      await useAuthStore.getState().setCredentials('tr_pat_test123');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'trigger_api_token',
        'tr_pat_test123'
      );

      const state = useAuthStore.getState();
      expect(state.token).toBe('tr_pat_test123');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('stores custom base URL when provided', async () => {
      await useAuthStore.getState().setCredentials('tr_pat_test', 'https://custom.api.dev');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'trigger_base_url',
        'https://custom.api.dev'
      );

      expect(useAuthStore.getState().baseUrl).toBe('https://custom.api.dev');
    });

    it('stores project ref when provided', async () => {
      await useAuthStore.getState().setCredentials('tr_pat_test', undefined, 'proj_abc');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'trigger_project_ref',
        'proj_abc'
      );

      expect(useAuthStore.getState().projectRef).toBe('proj_abc');
    });
  });

  describe('clearCredentials', () => {
    it('removes all credentials from secure store and resets state', async () => {
      // Set credentials first
      await useAuthStore.getState().setCredentials('tr_pat_test');

      // Now clear
      await useAuthStore.getState().clearCredentials();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('trigger_api_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('trigger_base_url');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('trigger_project_ref');

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.baseUrl).toBe('https://api.trigger.dev');
    });
  });

  describe('loadCredentials', () => {
    it('restores session from secure store when token exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'trigger_api_token') return Promise.resolve('tr_pat_saved');
        if (key === 'trigger_base_url') return Promise.resolve('https://custom.api.dev');
        if (key === 'trigger_project_ref') return Promise.resolve('proj_abc');
        return Promise.resolve(null);
      });

      await useAuthStore.getState().loadCredentials();

      const state = useAuthStore.getState();
      expect(state.token).toBe('tr_pat_saved');
      expect(state.baseUrl).toBe('https://custom.api.dev');
      expect(state.projectRef).toBe('proj_abc');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('sets isLoading to false when no token stored', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      await useAuthStore.getState().loadCredentials();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('handles secure store errors gracefully', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await useAuthStore.getState().loadCredentials();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });
});
