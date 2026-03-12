import {
  envVarKeys,
  useEnvVars,
  useCreateEnvVar,
  useUpdateEnvVar,
  useDeleteEnvVar,
  useImportEnvVars,
} from '../use-envvars';

describe('envVarKeys', () => {
  it('generates correct base key', () => {
    expect(envVarKeys.all).toEqual(['envvars']);
  });

  it('generates correct lists key', () => {
    expect(envVarKeys.lists()).toEqual(['envvars', 'list']);
  });

  it('generates correct list key with project and env', () => {
    expect(envVarKeys.list('proj_123', 'dev')).toEqual([
      'envvars', 'list', 'proj_123', 'dev',
    ]);
  });

  it('generates correct detail key', () => {
    expect(envVarKeys.detail('proj_123', 'dev', 'API_KEY')).toEqual([
      'envvars', 'detail', 'proj_123', 'dev', 'API_KEY',
    ]);
  });

  it('generates different keys for different environments', () => {
    const key1 = envVarKeys.list('proj_123', 'dev');
    const key2 = envVarKeys.list('proj_123', 'prod');
    expect(key1).not.toEqual(key2);
  });
});

describe('hooks exports', () => {
  it('useEnvVars is exported as a function', () => {
    expect(typeof useEnvVars).toBe('function');
  });

  it('useCreateEnvVar is exported as a function', () => {
    expect(typeof useCreateEnvVar).toBe('function');
  });

  it('useUpdateEnvVar is exported as a function', () => {
    expect(typeof useUpdateEnvVar).toBe('function');
  });

  it('useDeleteEnvVar is exported as a function', () => {
    expect(typeof useDeleteEnvVar).toBe('function');
  });

  it('useImportEnvVars is exported as a function', () => {
    expect(typeof useImportEnvVars).toBe('function');
  });
});
