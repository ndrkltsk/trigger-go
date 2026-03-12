import { matchRules, hasHighSeverityMatch } from '../rule-matcher';
import type { NotificationRule, NotificationEvent } from '@/stores/notification-rules-store';

function makeRule(overrides: Partial<NotificationRule> = {}): NotificationRule {
  return {
    id: 'rule_test',
    name: 'Test Rule',
    triggerType: 'task',
    triggerValue: 'send-email',
    eventType: 'failure',
    environment: 'any',
    severity: 'normal',
    enabled: true,
    ...overrides,
  };
}

function makeEvent(overrides: Partial<NotificationEvent> = {}): NotificationEvent {
  return {
    taskIdentifier: 'send-email',
    status: 'FAILED',
    environment: 'prod',
    ...overrides,
  };
}

describe('matchRules', () => {
  it('matches a task trigger with failure event', () => {
    const rules = [makeRule()];
    const matches = matchRules(makeEvent(), rules);
    expect(matches).toHaveLength(1);
  });

  it('does not match disabled rules', () => {
    const rules = [makeRule({ enabled: false })];
    const matches = matchRules(makeEvent(), rules);
    expect(matches).toHaveLength(0);
  });

  it('does not match wrong task identifier', () => {
    const rules = [makeRule({ triggerValue: 'process-payment' })];
    const matches = matchRules(makeEvent(), rules);
    expect(matches).toHaveLength(0);
  });

  it('does not match wrong environment', () => {
    const rules = [makeRule({ environment: 'staging' })];
    const matches = matchRules(makeEvent({ environment: 'prod' }), rules);
    expect(matches).toHaveLength(0);
  });

  it('matches with environment "any"', () => {
    const rules = [makeRule({ environment: 'any' })];
    const matches = matchRules(makeEvent({ environment: 'staging' }), rules);
    expect(matches).toHaveLength(1);
  });

  it('does not match wrong event type', () => {
    const rules = [makeRule({ eventType: 'completion' })];
    const matches = matchRules(makeEvent({ status: 'FAILED' }), rules);
    expect(matches).toHaveLength(0);
  });

  it('matches completion event type', () => {
    const rules = [makeRule({ eventType: 'completion' })];
    const matches = matchRules(makeEvent({ status: 'COMPLETED' }), rules);
    expect(matches).toHaveLength(1);
  });

  it('matches "any" event type for failures', () => {
    const rules = [makeRule({ eventType: 'any' })];
    const matches = matchRules(makeEvent({ status: 'FAILED' }), rules);
    expect(matches).toHaveLength(1);
  });

  it('matches "any" event type for completions', () => {
    const rules = [makeRule({ eventType: 'any' })];
    const matches = matchRules(makeEvent({ status: 'COMPLETED' }), rules);
    expect(matches).toHaveLength(1);
  });

  it('matches tag trigger', () => {
    const rules = [makeRule({ triggerType: 'tag', triggerValue: 'user_123' })];
    const matches = matchRules(makeEvent({ tags: ['user_123', 'org_456'] }), rules);
    expect(matches).toHaveLength(1);
  });

  it('does not match tag trigger when tag is missing', () => {
    const rules = [makeRule({ triggerType: 'tag', triggerValue: 'user_123' })];
    const matches = matchRules(makeEvent({ tags: ['org_456'] }), rules);
    expect(matches).toHaveLength(0);
  });

  it('does not match tag trigger when no tags provided', () => {
    const rules = [makeRule({ triggerType: 'tag', triggerValue: 'user_123' })];
    const matches = matchRules(makeEvent(), rules);
    expect(matches).toHaveLength(0);
  });

  it('matches schedule trigger', () => {
    const rules = [makeRule({ triggerType: 'schedule', triggerValue: 'sched_123' })];
    const matches = matchRules(makeEvent({ scheduleId: 'sched_123' }), rules);
    expect(matches).toHaveLength(1);
  });

  it('returns multiple matching rules', () => {
    const rules = [
      makeRule({ id: 'rule_1', name: 'Rule 1' }),
      makeRule({ id: 'rule_2', name: 'Rule 2', severity: 'high' }),
    ];
    const matches = matchRules(makeEvent(), rules);
    expect(matches).toHaveLength(2);
  });

  it('matches CRASHED status as failure', () => {
    const rules = [makeRule({ eventType: 'failure' })];
    const matches = matchRules(makeEvent({ status: 'CRASHED' }), rules);
    expect(matches).toHaveLength(1);
  });

  it('matches SYSTEM_FAILURE status as failure', () => {
    const rules = [makeRule({ eventType: 'failure' })];
    const matches = matchRules(makeEvent({ status: 'SYSTEM_FAILURE' }), rules);
    expect(matches).toHaveLength(1);
  });
});

describe('hasHighSeverityMatch', () => {
  it('returns true when a high severity rule matches', () => {
    const rules = [makeRule({ severity: 'high' })];
    expect(hasHighSeverityMatch(makeEvent(), rules)).toBe(true);
  });

  it('returns false when only normal severity rules match', () => {
    const rules = [makeRule({ severity: 'normal' })];
    expect(hasHighSeverityMatch(makeEvent(), rules)).toBe(false);
  });

  it('returns false when no rules match', () => {
    const rules = [makeRule({ triggerValue: 'other-task', severity: 'high' })];
    expect(hasHighSeverityMatch(makeEvent(), rules)).toBe(false);
  });
});
