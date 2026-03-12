import { create } from 'zustand';
import { storage } from '@/lib/storage';

export interface NotificationRule {
  id: string;
  name: string;
  triggerType: 'task' | 'tag' | 'schedule';
  triggerValue: string;
  eventType: 'failure' | 'completion' | 'any';
  environment: 'dev' | 'staging' | 'prod' | 'any';
  severity: 'normal' | 'high';
  enabled: boolean;
}

export interface NotificationEvent {
  taskIdentifier: string;
  status: string;
  environment: string;
  tags?: string[];
  scheduleId?: string;
}

const RULES_STORAGE_KEY = 'notification_rules';

function generateId(): string {
  return `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadRules(): NotificationRule[] {
  const json = storage.getString(RULES_STORAGE_KEY);
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

function saveRules(rules: NotificationRule[]): void {
  storage.set(RULES_STORAGE_KEY, JSON.stringify(rules));
}

interface NotificationRulesState {
  rules: NotificationRule[];
  addRule: (rule: Omit<NotificationRule, 'id'>) => void;
  updateRule: (id: string, updates: Partial<Omit<NotificationRule, 'id'>>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
  getRulesForEvent: (event: NotificationEvent) => NotificationRule[];
  loadRules: () => void;
}

export const useNotificationRulesStore = create<NotificationRulesState>((set, get) => ({
  rules: [],

  addRule: (rule) => {
    const newRule: NotificationRule = { ...rule, id: generateId() };
    const updated = [...get().rules, newRule];
    saveRules(updated);
    set({ rules: updated });
  },

  updateRule: (id, updates) => {
    const updated = get().rules.map((r) => (r.id === id ? { ...r, ...updates } : r));
    saveRules(updated);
    set({ rules: updated });
  },

  deleteRule: (id) => {
    const updated = get().rules.filter((r) => r.id !== id);
    saveRules(updated);
    set({ rules: updated });
  },

  toggleRule: (id) => {
    const updated = get().rules.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    saveRules(updated);
    set({ rules: updated });
  },

  getRulesForEvent: (event) => {
    return get().rules.filter((rule) => {
      if (!rule.enabled) return false;

      // Match environment
      if (rule.environment !== 'any' && rule.environment !== event.environment.toLowerCase()) {
        return false;
      }

      // Match event type
      const FAILURE_STATUSES = ['FAILED', 'CRASHED', 'SYSTEM_FAILURE'];
      const COMPLETION_STATUSES = ['COMPLETED'];
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
  },

  loadRules: () => {
    set({ rules: loadRules() });
  },
}));
