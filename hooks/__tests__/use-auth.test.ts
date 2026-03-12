import { renderHook, act } from '@testing-library/react-native';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { server } from '@/__mocks__/msw/server';
import { http, HttpResponse } from 'msw';

const BASE_URL = 'https://api.trigger.dev';

// Start MSW server
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  useAuthStore.setState({
    token: null,
    baseUrl: BASE_URL,
    projectRef: null,
    isAuthenticated: false,
    isLoading: false,
  });
});
afterAll(() => server.close());

describe('useAuth', () => {
  describe('login', () => {
    it('validates PAT and returns needs_project', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/projects`, () => {
          return HttpResponse.json({
            data: [{ id: 'p1', externalRef: 'proj_abc', name: 'Test', slug: 'test', createdAt: '', organization: { id: 'o1', title: 'Org', slug: 'org', createdAt: '' } }],
          });
        })
      );

      const { result } = renderHook(() => useAuth());

      let loginResult: boolean | 'needs_project';
      await act(async () => {
        loginResult = await result.current.login('tr_pat_valid_pat_123');
      });

      expect(loginResult!).toBe('needs_project');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('returns error for empty key', async () => {
      const { result } = renderHook(() => useAuth());

      let loginResult: boolean | 'needs_project';
      await act(async () => {
        loginResult = await result.current.login('');
      });

      expect(loginResult!).toBe(false);
      expect(result.current.error).toBe('Please enter a Personal Access Token.');
    });

    it('returns error for invalid format', async () => {
      const { result } = renderHook(() => useAuth());

      let loginResult: boolean | 'needs_project';
      await act(async () => {
        loginResult = await result.current.login('not_a_valid_key');
      });

      expect(loginResult!).toBe(false);
      expect(result.current.error).toContain('Invalid token format');
    });

    it('returns error for secret key format', async () => {
      const { result } = renderHook(() => useAuth());

      let loginResult: boolean | 'needs_project';
      await act(async () => {
        loginResult = await result.current.login('tr_dev_some_key');
      });

      expect(loginResult!).toBe(false);
      expect(result.current.error).toContain('Invalid token format');
    });

    it('returns error when API rejects the token', async () => {
      server.use(
        http.get(`${BASE_URL}/api/v1/projects`, () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      const { result } = renderHook(() => useAuth());

      let loginResult: boolean | 'needs_project';
      await act(async () => {
        loginResult = await result.current.login('tr_pat_invalid_pat');
      });

      expect(loginResult!).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe('Unable to connect. Please check your token and try again.');
    });
  });

  describe('logout', () => {
    it('clears all auth state', async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        token: 'tr_pat_test',
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.token).toBeNull();
    });
  });

  describe('restoreSession', () => {
    it('returns true when session is restored', async () => {
      // Simulate stored token
      const SecureStore = require('expo-secure-store');
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'trigger_api_token') return Promise.resolve('tr_pat_stored');
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAuth());

      let restored: boolean;
      await act(async () => {
        restored = await result.current.restoreSession();
      });

      expect(restored!).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('returns false when no stored session', async () => {
      const SecureStore = require('expo-secure-store');
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useAuth());

      let restored: boolean;
      await act(async () => {
        restored = await result.current.restoreSession();
      });

      expect(restored!).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
