import { taskKeys, useTriggerTask, useBatchTrigger } from '../use-tasks';

describe('taskKeys', () => {
  it('generates correct base key', () => {
    expect(taskKeys.all).toEqual(['tasks']);
  });
});

describe('useTriggerTask', () => {
  it('is exported as a function', () => {
    expect(typeof useTriggerTask).toBe('function');
  });
});

describe('useBatchTrigger', () => {
  it('is exported as a function', () => {
    expect(typeof useBatchTrigger).toBe('function');
  });
});
