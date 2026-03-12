import { runKeys, useRescheduleRun, useUpdateRunMetadata } from '../use-runs';

describe('runKeys', () => {
  it('generates correct base key', () => {
    expect(runKeys.all).toEqual(['runs']);
  });

  it('generates correct lists key', () => {
    expect(runKeys.lists()).toEqual(['runs', 'list']);
  });

  it('generates correct list key with filters', () => {
    const filters = { status: ['COMPLETED'] };
    const key = runKeys.list(filters, 'secret_key');
    expect(key).toEqual(['runs', 'list', { filters, environment: 'secret_key' }]);
  });

  it('generates correct list key with different filters', () => {
    const filters1 = { status: ['COMPLETED'] };
    const filters2 = { status: ['FAILED'] };
    const key1 = runKeys.list(filters1, 'secret_key');
    const key2 = runKeys.list(filters2, 'secret_key');
    expect(key1).not.toEqual(key2);
  });

  it('generates correct detail key', () => {
    expect(runKeys.detail('run_123')).toEqual(['runs', 'detail', 'run_123']);
  });

  it('generates correct details base key', () => {
    expect(runKeys.details()).toEqual(['runs', 'detail']);
  });

  it('includes environment in list key so env switches trigger refetch', () => {
    const filters = {};
    const key1 = runKeys.list(filters, 'dev');
    const key2 = runKeys.list(filters, 'prod');
    expect(key1).not.toEqual(key2);
  });
});

describe('useRescheduleRun', () => {
  it('is exported as a function', () => {
    expect(typeof useRescheduleRun).toBe('function');
  });
});

describe('useUpdateRunMetadata', () => {
  it('is exported as a function', () => {
    expect(typeof useUpdateRunMetadata).toBe('function');
  });
});
