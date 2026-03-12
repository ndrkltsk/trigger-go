import { useNotificationRulesStore, type NotificationRule } from '../notification-rules-store';

const mockStorage: Record<string, string> = {};

jest.mock('@/lib/storage', () => ({
  storage: {
    getString: (key: string) => mockStorage[key] ?? undefined,
    set: (key: string, value: string) => {
      mockStorage[key] = value;
    },
    delete: (key: string) => {
      delete mockStorage[key];
    },
  },
}));

describe('notification-rules-store', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    useNotificationRulesStore.setState({ rules: [] });
  });

  it('starts with empty rules', () => {
    expect(useNotificationRulesStore.getState().rules).toEqual([]);
  });

  it('adds a rule', () => {
    useNotificationRulesStore.getState().addRule({
      name: 'Test Rule',
      triggerType: 'task',
      triggerValue: 'send-email',
      eventType: 'failure',
      environment: 'prod',
      severity: 'normal',
      enabled: true,
    });

    const { rules } = useNotificationRulesStore.getState();
    expect(rules).toHaveLength(1);
    expect(rules[0].name).toBe('Test Rule');
    expect(rules[0].triggerType).toBe('task');
    expect(rules[0].id).toMatch(/^rule_/);
  });

  it('updates a rule', () => {
    useNotificationRulesStore.getState().addRule({
      name: 'Original',
      triggerType: 'task',
      triggerValue: 'task-a',
      eventType: 'failure',
      environment: 'prod',
      severity: 'normal',
      enabled: true,
    });

    const ruleId = useNotificationRulesStore.getState().rules[0].id;
    useNotificationRulesStore.getState().updateRule(ruleId, { name: 'Updated' });

    expect(useNotificationRulesStore.getState().rules[0].name).toBe('Updated');
  });

  it('deletes a rule', () => {
    useNotificationRulesStore.getState().addRule({
      name: 'To Delete',
      triggerType: 'task',
      triggerValue: 'task-a',
      eventType: 'failure',
      environment: 'any',
      severity: 'normal',
      enabled: true,
    });

    const ruleId = useNotificationRulesStore.getState().rules[0].id;
    useNotificationRulesStore.getState().deleteRule(ruleId);

    expect(useNotificationRulesStore.getState().rules).toHaveLength(0);
  });

  it('toggles a rule', () => {
    useNotificationRulesStore.getState().addRule({
      name: 'Toggle Me',
      triggerType: 'task',
      triggerValue: 'task-a',
      eventType: 'failure',
      environment: 'any',
      severity: 'normal',
      enabled: true,
    });

    const ruleId = useNotificationRulesStore.getState().rules[0].id;
    expect(useNotificationRulesStore.getState().rules[0].enabled).toBe(true);

    useNotificationRulesStore.getState().toggleRule(ruleId);
    expect(useNotificationRulesStore.getState().rules[0].enabled).toBe(false);

    useNotificationRulesStore.getState().toggleRule(ruleId);
    expect(useNotificationRulesStore.getState().rules[0].enabled).toBe(true);
  });

  it('persists rules to storage', () => {
    useNotificationRulesStore.getState().addRule({
      name: 'Persist Me',
      triggerType: 'tag',
      triggerValue: 'user_123',
      eventType: 'any',
      environment: 'any',
      severity: 'high',
      enabled: true,
    });

    const stored = JSON.parse(mockStorage['notification_rules']);
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Persist Me');
  });

  it('loads rules from storage', () => {
    const savedRules: NotificationRule[] = [
      {
        id: 'rule_saved',
        name: 'Saved Rule',
        triggerType: 'task',
        triggerValue: 'process-payment',
        eventType: 'failure',
        environment: 'prod',
        severity: 'high',
        enabled: true,
      },
    ];
    mockStorage['notification_rules'] = JSON.stringify(savedRules);

    useNotificationRulesStore.getState().loadRules();
    expect(useNotificationRulesStore.getState().rules).toHaveLength(1);
    expect(useNotificationRulesStore.getState().rules[0].name).toBe('Saved Rule');
  });

  it('getRulesForEvent matches task trigger', () => {
    useNotificationRulesStore.getState().addRule({
      name: 'Match Task',
      triggerType: 'task',
      triggerValue: 'send-email',
      eventType: 'failure',
      environment: 'any',
      severity: 'normal',
      enabled: true,
    });

    const matches = useNotificationRulesStore.getState().getRulesForEvent({
      taskIdentifier: 'send-email',
      status: 'FAILED',
      environment: 'prod',
    });

    expect(matches).toHaveLength(1);
    expect(matches[0].name).toBe('Match Task');
  });

  it('getRulesForEvent does not match disabled rules', () => {
    useNotificationRulesStore.getState().addRule({
      name: 'Disabled Rule',
      triggerType: 'task',
      triggerValue: 'send-email',
      eventType: 'failure',
      environment: 'any',
      severity: 'normal',
      enabled: false,
    });

    const matches = useNotificationRulesStore.getState().getRulesForEvent({
      taskIdentifier: 'send-email',
      status: 'FAILED',
      environment: 'prod',
    });

    expect(matches).toHaveLength(0);
  });

  it('getRulesForEvent filters by environment', () => {
    useNotificationRulesStore.getState().addRule({
      name: 'Prod Only',
      triggerType: 'task',
      triggerValue: 'send-email',
      eventType: 'failure',
      environment: 'prod',
      severity: 'normal',
      enabled: true,
    });

    const devMatch = useNotificationRulesStore.getState().getRulesForEvent({
      taskIdentifier: 'send-email',
      status: 'FAILED',
      environment: 'dev',
    });

    const prodMatch = useNotificationRulesStore.getState().getRulesForEvent({
      taskIdentifier: 'send-email',
      status: 'FAILED',
      environment: 'prod',
    });

    expect(devMatch).toHaveLength(0);
    expect(prodMatch).toHaveLength(1);
  });
});
