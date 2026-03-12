import { triggerTask } from '../tasks';
import { ApiError } from '@/lib/errors';

jest.mock('../client', () => ({
  getApiClient: jest.fn(),
}));

const { getApiClient } = require('../client');

describe('triggerTask', () => {
  const mockPost = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    getApiClient.mockReturnValue({ POST: mockPost });
  });

  it('calls POST with correct path and body', async () => {
    mockPost.mockResolvedValue({
      data: { id: 'run_123' },
      error: undefined,
      response: { ok: true, status: 200 },
    });

    const result = await triggerTask('my-task', {
      payload: { message: 'hello' },
    });

    expect(mockPost).toHaveBeenCalledWith('/api/v1/tasks/{taskIdentifier}/trigger', {
      params: { path: { taskIdentifier: 'my-task' } },
      body: {
        payload: { message: 'hello' },
        options: undefined,
      },
    });
    expect(result).toEqual({ id: 'run_123' });
  });

  it('sends options when provided', async () => {
    mockPost.mockResolvedValue({
      data: { id: 'run_456' },
      error: undefined,
      response: { ok: true, status: 200 },
    });

    await triggerTask('my-task', {
      payload: { data: 1 },
      options: {
        delay: '5m',
        tags: ['user_123'],
        queue: { name: 'my-queue' },
      },
    });

    expect(mockPost).toHaveBeenCalledWith('/api/v1/tasks/{taskIdentifier}/trigger', {
      params: { path: { taskIdentifier: 'my-task' } },
      body: {
        payload: { data: 1 },
        options: {
          delay: '5m',
          tags: ['user_123'],
          queue: { name: 'my-queue' },
        },
      },
    });
  });

  it('throws ApiError on failure', async () => {
    mockPost.mockResolvedValue({
      data: undefined,
      error: { error: 'Task not found' },
      response: { ok: false, status: 404 },
    });

    await expect(triggerTask('nonexistent-task')).rejects.toThrow(ApiError);
    await expect(triggerTask('nonexistent-task')).rejects.toMatchObject({
      status: 404,
      body: { error: 'Task not found' },
    });
  });

  it('uses default error message when error body is missing', async () => {
    mockPost.mockResolvedValue({
      data: undefined,
      error: undefined,
      response: { ok: false, status: 500 },
    });

    await expect(triggerTask('my-task')).rejects.toMatchObject({
      status: 500,
      body: { error: 'Failed to trigger task' },
    });
  });

  it('works with no params (empty payload)', async () => {
    mockPost.mockResolvedValue({
      data: { id: 'run_789' },
      error: undefined,
      response: { ok: true, status: 200 },
    });

    const result = await triggerTask('my-task');

    expect(mockPost).toHaveBeenCalledWith('/api/v1/tasks/{taskIdentifier}/trigger', {
      params: { path: { taskIdentifier: 'my-task' } },
      body: {
        payload: undefined,
        options: undefined,
      },
    });
    expect(result).toEqual({ id: 'run_789' });
  });
});
