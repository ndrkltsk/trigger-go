import { listEnvVars, createEnvVar, retrieveEnvVar, updateEnvVar, deleteEnvVar } from '../envvars';
import { ApiError } from '@/lib/errors';

jest.mock('../client', () => ({
  getApiClient: jest.fn(),
}));

const { getApiClient } = require('../client');

describe('envvars API', () => {
  const mockGET = jest.fn();
  const mockPOST = jest.fn();
  const mockPUT = jest.fn();
  const mockDELETE = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    getApiClient.mockReturnValue({
      GET: mockGET,
      POST: mockPOST,
      PUT: mockPUT,
      DELETE: mockDELETE,
    });
  });

  describe('listEnvVars', () => {
    it('calls GET with correct path params', async () => {
      const vars = [{ name: 'API_KEY', value: 'abc' }];
      mockGET.mockResolvedValue({
        data: vars,
        error: undefined,
        response: { ok: true, status: 200 },
      });

      const result = await listEnvVars('proj_123', 'dev');

      expect(mockGET).toHaveBeenCalledWith('/api/v1/projects/{projectRef}/envvars/{env}', {
        params: { path: { projectRef: 'proj_123', env: 'dev' } },
      });
      expect(result).toEqual(vars);
    });

    it('throws ApiError on failure', async () => {
      mockGET.mockResolvedValue({
        data: undefined,
        error: { error: 'Not found' },
        response: { ok: false, status: 404 },
      });

      await expect(listEnvVars('proj_123', 'dev')).rejects.toThrow(ApiError);
    });
  });

  describe('createEnvVar', () => {
    it('calls POST with correct path and body', async () => {
      mockPOST.mockResolvedValue({
        data: { success: true },
        error: undefined,
        response: { ok: true, status: 200 },
      });

      const result = await createEnvVar('proj_123', 'dev', { name: 'KEY', value: 'val' });

      expect(mockPOST).toHaveBeenCalledWith('/api/v1/projects/{projectRef}/envvars/{env}', {
        params: { path: { projectRef: 'proj_123', env: 'dev' } },
        body: { name: 'KEY', value: 'val' },
      });
      expect(result).toEqual({ success: true });
    });

    it('throws ApiError on failure', async () => {
      mockPOST.mockResolvedValue({
        data: undefined,
        error: { error: 'Duplicate' },
        response: { ok: false, status: 400 },
      });

      await expect(
        createEnvVar('proj_123', 'dev', { name: 'KEY', value: 'val' })
      ).rejects.toThrow(ApiError);
    });
  });

  describe('retrieveEnvVar', () => {
    it('calls GET with name in path', async () => {
      mockGET.mockResolvedValue({
        data: { value: 'secret' },
        error: undefined,
        response: { ok: true, status: 200 },
      });

      const result = await retrieveEnvVar('proj_123', 'staging', 'MY_VAR');

      expect(mockGET).toHaveBeenCalledWith('/api/v1/projects/{projectRef}/envvars/{env}/{name}', {
        params: { path: { projectRef: 'proj_123', env: 'staging', name: 'MY_VAR' } },
      });
      expect(result).toEqual({ value: 'secret' });
    });
  });

  describe('updateEnvVar', () => {
    it('calls PUT with name and value body', async () => {
      mockPUT.mockResolvedValue({
        data: { success: true },
        error: undefined,
        response: { ok: true, status: 200 },
      });

      const result = await updateEnvVar('proj_123', 'prod', 'MY_VAR', 'new_value');

      expect(mockPUT).toHaveBeenCalledWith('/api/v1/projects/{projectRef}/envvars/{env}/{name}', {
        params: { path: { projectRef: 'proj_123', env: 'prod', name: 'MY_VAR' } },
        body: { value: 'new_value' },
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('deleteEnvVar', () => {
    it('calls DELETE with correct path', async () => {
      mockDELETE.mockResolvedValue({
        data: { success: true },
        error: undefined,
        response: { ok: true, status: 200 },
      });

      const result = await deleteEnvVar('proj_123', 'dev', 'OLD_VAR');

      expect(mockDELETE).toHaveBeenCalledWith('/api/v1/projects/{projectRef}/envvars/{env}/{name}', {
        params: { path: { projectRef: 'proj_123', env: 'dev', name: 'OLD_VAR' } },
      });
      expect(result).toEqual({ success: true });
    });

    it('throws ApiError on failure', async () => {
      mockDELETE.mockResolvedValue({
        data: undefined,
        error: { error: 'Not found' },
        response: { ok: false, status: 404 },
      });

      await expect(deleteEnvVar('proj_123', 'dev', 'OLD_VAR')).rejects.toThrow(ApiError);
    });
  });
});
