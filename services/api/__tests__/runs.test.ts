import { updateRunMetadata } from '../runs';
import { ApiError } from '@/lib/errors';

jest.mock('../client', () => ({
  getApiClient: jest.fn(),
}));

const { getApiClient } = require('../client');

describe('updateRunMetadata', () => {
  const mockPut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    getApiClient.mockReturnValue({ PUT: mockPut });
  });

  it('calls PUT with correct path and body', async () => {
    mockPut.mockResolvedValue({
      data: { metadata: { updated: true } },
      error: undefined,
      response: { ok: true, status: 200 },
    });

    const result = await updateRunMetadata('run_123', { updated: true });

    expect(mockPut).toHaveBeenCalledWith('/api/v1/runs/{runId}/metadata', {
      params: { path: { runId: 'run_123' } },
      body: { metadata: { updated: true } },
    });
    expect(result).toEqual({ metadata: { updated: true } });
  });

  it('throws ApiError on failure', async () => {
    mockPut.mockResolvedValue({
      data: undefined,
      error: { error: 'Invalid metadata' },
      response: { ok: false, status: 400 },
    });

    await expect(updateRunMetadata('run_123', {})).rejects.toThrow(ApiError);
    await expect(updateRunMetadata('run_123', {})).rejects.toMatchObject({
      status: 400,
      body: { error: 'Invalid metadata' },
    });
  });

  it('uses default error message when error body is missing', async () => {
    mockPut.mockResolvedValue({
      data: undefined,
      error: undefined,
      response: { ok: false, status: 500 },
    });

    await expect(updateRunMetadata('run_123', {})).rejects.toMatchObject({
      status: 500,
      body: { error: 'Failed to update metadata' },
    });
  });
});
