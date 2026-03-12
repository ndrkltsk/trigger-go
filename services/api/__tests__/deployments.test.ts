import { promoteDeployment } from '../deployments';
import { ApiError } from '@/lib/errors';

jest.mock('../client', () => ({
  getApiClient: jest.fn(),
}));

const { getApiClient } = require('../client');

describe('promoteDeployment', () => {
  const mockPost = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    getApiClient.mockReturnValue({ POST: mockPost });
  });

  it('calls POST with correct path params', async () => {
    mockPost.mockResolvedValue({
      data: { id: 'deploy_1', version: '20250228.1', shortCode: 'abc123' },
      error: undefined,
      response: { ok: true, status: 200 },
    });

    const result = await promoteDeployment('20250228.1');

    expect(mockPost).toHaveBeenCalledWith('/api/v1/deployments/{version}/promote', {
      params: { path: { version: '20250228.1' } },
    });
    expect(result).toEqual({ id: 'deploy_1', version: '20250228.1', shortCode: 'abc123' });
  });

  it('throws ApiError on failure', async () => {
    mockPost.mockResolvedValue({
      data: undefined,
      error: { error: 'Deployment not found' },
      response: { ok: false, status: 404 },
    });

    await expect(promoteDeployment('invalid')).rejects.toThrow(ApiError);
    await expect(promoteDeployment('invalid')).rejects.toMatchObject({
      status: 404,
      body: { error: 'Deployment not found' },
    });
  });

  it('uses default error message when error body is missing', async () => {
    mockPost.mockResolvedValue({
      data: undefined,
      error: undefined,
      response: { ok: false, status: 500 },
    });

    await expect(promoteDeployment('20250228.1')).rejects.toMatchObject({
      status: 500,
      body: { error: 'Failed to promote deployment' },
    });
  });
});
