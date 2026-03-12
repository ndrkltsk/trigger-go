import { deploymentKeys, useDeployment, useDeployments, usePromoteDeployment } from '../use-deployments';

describe('deploymentKeys', () => {
  it('generates correct base key', () => {
    expect(deploymentKeys.all).toEqual(['deployments']);
  });

  it('generates correct list key with environment', () => {
    const key = deploymentKeys.list('dev');
    expect(key).toEqual(['deployments', 'list', { environment: 'dev' }]);
  });

  it('generates different list keys for different environments', () => {
    const key1 = deploymentKeys.list('dev');
    const key2 = deploymentKeys.list('prod');
    expect(key1).not.toEqual(key2);
  });

  it('generates correct details base key', () => {
    expect(deploymentKeys.details()).toEqual(['deployments', 'detail']);
  });

  it('generates correct detail key', () => {
    expect(deploymentKeys.detail('deploy_123')).toEqual(['deployments', 'detail', 'deploy_123']);
  });

  it('generates different detail keys for different IDs', () => {
    const key1 = deploymentKeys.detail('deploy_1');
    const key2 = deploymentKeys.detail('deploy_2');
    expect(key1).not.toEqual(key2);
  });
});

describe('useDeployments', () => {
  it('is exported as a function', () => {
    expect(typeof useDeployments).toBe('function');
  });
});

describe('useDeployment', () => {
  it('is exported as a function', () => {
    expect(typeof useDeployment).toBe('function');
  });
});

describe('usePromoteDeployment', () => {
  it('is exported as a function', () => {
    expect(typeof usePromoteDeployment).toBe('function');
  });
});
