import { RUN_STATUS_CONFIG, DEPLOYMENT_STATUS_CONFIG, getStatusConfig, getDeploymentStatusConfig } from '@/lib/status-colors';

const REQUIRED_STATUSES = [
  'PENDING_VERSION',
  'DELAYED',
  'QUEUED',
  'EXECUTING',
  'REATTEMPTING',
  'FROZEN',
  'COMPLETED',
  'CANCELED',
  'FAILED',
  'CRASHED',
  'INTERRUPTED',
  'SYSTEM_FAILURE',
];

describe('RUN_STATUS_CONFIG', () => {
  it('has entries for all required run statuses', () => {
    for (const status of REQUIRED_STATUSES) {
      expect(RUN_STATUS_CONFIG[status]).toBeDefined();
    }
  });

  it.each(Object.entries(RUN_STATUS_CONFIG))(
    'status %s has all required fields',
    (_, config) => {
      expect(config).toHaveProperty('label');
      expect(config).toHaveProperty('color');
      expect(config).toHaveProperty('bgClass');
      expect(config).toHaveProperty('textClass');
      expect(config).toHaveProperty('icon');
      expect(typeof config.isTerminal).toBe('boolean');
      expect(typeof config.isActive).toBe('boolean');
    }
  );

  it('marks terminal statuses correctly', () => {
    const terminalStatuses = ['COMPLETED', 'CANCELED', 'FAILED', 'CRASHED', 'INTERRUPTED', 'SYSTEM_FAILURE'];
    for (const status of terminalStatuses) {
      expect(RUN_STATUS_CONFIG[status].isTerminal).toBe(true);
    }
  });

  it('marks active statuses correctly', () => {
    expect(RUN_STATUS_CONFIG.EXECUTING.isActive).toBe(true);
    expect(RUN_STATUS_CONFIG.QUEUED.isActive).toBe(false);
    expect(RUN_STATUS_CONFIG.COMPLETED.isActive).toBe(false);
  });
});

describe('getStatusConfig', () => {
  it('returns config for known status', () => {
    const config = getStatusConfig('COMPLETED');
    expect(config.label).toBe('Completed');
  });

  it('returns fallback for unknown status', () => {
    const config = getStatusConfig('UNKNOWN_STATUS');
    expect(config.label).toBe('UNKNOWN_STATUS');
    expect(config.icon).toBe('help-circle');
  });
});

const REQUIRED_DEPLOYMENT_STATUSES = [
  'PENDING',
  'INSTALLING',
  'BUILDING',
  'DEPLOYING',
  'DEPLOYED',
  'FAILED',
  'CANCELED',
  'TIMED_OUT',
];

describe('DEPLOYMENT_STATUS_CONFIG', () => {
  it('has entries for all required deployment statuses', () => {
    for (const status of REQUIRED_DEPLOYMENT_STATUSES) {
      expect(DEPLOYMENT_STATUS_CONFIG[status]).toBeDefined();
    }
  });

  it.each(Object.entries(DEPLOYMENT_STATUS_CONFIG))(
    'deployment status %s has all required fields',
    (_, config) => {
      expect(config).toHaveProperty('label');
      expect(config).toHaveProperty('color');
      expect(config).toHaveProperty('bgClass');
      expect(config).toHaveProperty('textClass');
      expect(config).toHaveProperty('icon');
      expect(typeof config.isTerminal).toBe('boolean');
      expect(typeof config.isActive).toBe('boolean');
    }
  );

  it('marks active deployment statuses correctly', () => {
    expect(DEPLOYMENT_STATUS_CONFIG.DEPLOYING.isActive).toBe(true);
    expect(DEPLOYMENT_STATUS_CONFIG.BUILDING.isActive).toBe(true);
    expect(DEPLOYMENT_STATUS_CONFIG.DEPLOYED.isActive).toBe(false);
  });

  it('marks terminal deployment statuses correctly', () => {
    expect(DEPLOYMENT_STATUS_CONFIG.DEPLOYED.isTerminal).toBe(true);
    expect(DEPLOYMENT_STATUS_CONFIG.FAILED.isTerminal).toBe(true);
    expect(DEPLOYMENT_STATUS_CONFIG.DEPLOYING.isTerminal).toBe(false);
  });
});

describe('getDeploymentStatusConfig', () => {
  it('returns config for known deployment status', () => {
    const config = getDeploymentStatusConfig('DEPLOYED');
    expect(config.label).toBe('Deployed');
  });

  it('returns fallback for unknown deployment status', () => {
    const config = getDeploymentStatusConfig('UNKNOWN');
    expect(config.label).toBe('UNKNOWN');
    expect(config.icon).toBe('help-circle');
  });
});
