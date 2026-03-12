import type { NotificationRule, NotificationEvent } from '@/stores/notification-rules-store';

const FAILURE_STATUSES = ['FAILED', 'CRASHED', 'SYSTEM_FAILURE'];
const COMPLETION_STATUSES = ['COMPLETED'];

export function matchRules(
  event: NotificationEvent,
  rules: NotificationRule[]
): NotificationRule[] {
  return rules.filter((rule) => {
    if (!rule.enabled) return false;

    // Match environment
    if (rule.environment !== 'any' && rule.environment !== event.environment.toLowerCase()) {
      return false;
    }

    // Match event type
    if (rule.eventType === 'failure' && !FAILURE_STATUSES.includes(event.status)) return false;
    if (rule.eventType === 'completion' && !COMPLETION_STATUSES.includes(event.status)) return false;

    // Match trigger
    switch (rule.triggerType) {
      case 'task':
        return event.taskIdentifier === rule.triggerValue;
      case 'tag':
        return event.tags?.includes(rule.triggerValue) ?? false;
      case 'schedule':
        return event.scheduleId === rule.triggerValue;
      default:
        return false;
    }
  });
}

export function hasHighSeverityMatch(
  event: NotificationEvent,
  rules: NotificationRule[]
): boolean {
  return matchRules(event, rules).some((r) => r.severity === 'high');
}
