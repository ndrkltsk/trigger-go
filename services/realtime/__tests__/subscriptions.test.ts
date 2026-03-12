import { subscribeToRun } from '@/services/realtime/subscriptions';

const mockAddEventListener = jest.fn();
const mockClose = jest.fn();

jest.mock('react-native-sse', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      addEventListener: mockAddEventListener,
      close: mockClose,
    })),
  };
});

const EventSource = require('react-native-sse').default;

describe('subscribeToRun', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates EventSource with correct URL and auth header', () => {
    subscribeToRun('run_123', 'tok_abc', 'https://api.trigger.dev');

    expect(EventSource).toHaveBeenCalledWith(
      'https://api.trigger.dev/realtime/v1/runs/run_123',
      { headers: { Authorization: 'Bearer tok_abc' } }
    );
  });

  it('onUpdate registers listener for update events', () => {
    const sub = subscribeToRun('run_123', 'tok_abc', 'https://api.trigger.dev');
    const callback = jest.fn();

    sub.onUpdate(callback);

    expect(mockAddEventListener).toHaveBeenCalledWith('update', expect.any(Function));
  });

  it('onUpdate callback parses JSON data and invokes with run object', () => {
    const sub = subscribeToRun('run_123', 'tok_abc', 'https://api.trigger.dev');
    const callback = jest.fn();

    sub.onUpdate(callback);

    // Get the registered listener
    const listener = mockAddEventListener.mock.calls.find(
      (call: unknown[]) => call[0] === 'update'
    )?.[1];

    const runData = { id: 'run_123', status: 'EXECUTING', taskIdentifier: 'test-task' };
    listener({ type: 'update', data: JSON.stringify(runData) });

    expect(callback).toHaveBeenCalledWith(runData);
  });

  it('onUpdate ignores events with null data', () => {
    const sub = subscribeToRun('run_123', 'tok_abc', 'https://api.trigger.dev');
    const callback = jest.fn();

    sub.onUpdate(callback);

    const listener = mockAddEventListener.mock.calls.find(
      (call: unknown[]) => call[0] === 'update'
    )?.[1];

    listener({ type: 'update', data: null });

    expect(callback).not.toHaveBeenCalled();
  });

  it('onUpdate ignores malformed JSON', () => {
    const sub = subscribeToRun('run_123', 'tok_abc', 'https://api.trigger.dev');
    const callback = jest.fn();

    sub.onUpdate(callback);

    const listener = mockAddEventListener.mock.calls.find(
      (call: unknown[]) => call[0] === 'update'
    )?.[1];

    listener({ type: 'update', data: 'not-json' });

    expect(callback).not.toHaveBeenCalled();
  });

  it('onError registers listener for error events', () => {
    const sub = subscribeToRun('run_123', 'tok_abc', 'https://api.trigger.dev');
    const callback = jest.fn();

    sub.onError(callback);

    expect(mockAddEventListener).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('onError callback receives error event', () => {
    const sub = subscribeToRun('run_123', 'tok_abc', 'https://api.trigger.dev');
    const callback = jest.fn();

    sub.onError(callback);

    const listener = mockAddEventListener.mock.calls.find(
      (call: unknown[]) => call[0] === 'error'
    )?.[1];

    listener({ type: 'error', message: 'Connection failed' });

    expect(callback).toHaveBeenCalledWith({ type: 'error', message: 'Connection failed' });
  });

  it('close terminates the EventSource connection', () => {
    const sub = subscribeToRun('run_123', 'tok_abc', 'https://api.trigger.dev');

    sub.close();

    expect(mockClose).toHaveBeenCalled();
  });
});
