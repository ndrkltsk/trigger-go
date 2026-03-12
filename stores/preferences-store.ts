import { create } from 'zustand';
import { storage } from '@/lib/storage';
import { posthogCapture, posthogRegister } from '@/services/posthog';

export type Environment = 'dev' | 'staging' | 'prod' | 'preview';

export const ALL_CANDIDATE_ENVIRONMENTS: Environment[] = ['dev', 'staging', 'prod', 'preview'];

export interface NotifyEnvironments {
  dev: boolean;
  staging: boolean;
  prod: boolean;
  preview: boolean;
}

interface PreferencesState {
  hapticFeedbackEnabled: boolean;
  selectedEnvironment: Environment;
  notificationsEnabled: boolean;
  notifyOnFailures: boolean;
  notifyOnCompletions: boolean;
  notifyOnDelays: boolean;
  notifyEnvironments: NotifyEnvironments;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  biometricLockEnabled: boolean;
  biometricForSensitiveActions: boolean;

  setHapticFeedback: (enabled: boolean) => void;
  setEnvironment: (env: Environment) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotifyOnFailures: (enabled: boolean) => void;
  setNotifyOnCompletions: (enabled: boolean) => void;
  setNotifyOnDelays: (enabled: boolean) => void;
  setNotifyEnvironments: (envs: NotifyEnvironments) => void;
  setQuietHoursEnabled: (enabled: boolean) => void;
  setQuietHoursStart: (time: string) => void;
  setQuietHoursEnd: (time: string) => void;
  setBiometricLockEnabled: (enabled: boolean) => void;
  setBiometricForSensitiveActions: (enabled: boolean) => void;
  loadPreferences: () => void;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  hapticFeedbackEnabled: true,
  selectedEnvironment: 'dev',
  notificationsEnabled: true,
  notifyOnFailures: true,
  notifyOnCompletions: false,
  notifyOnDelays: false,
  notifyEnvironments: { dev: false, staging: false, prod: true, preview: false },
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  biometricLockEnabled: false,
  biometricForSensitiveActions: false,

  setHapticFeedback: (enabled) => {
    storage.set('hapticFeedbackEnabled', enabled);
    posthogCapture('haptic_feedback toggled', { enabled });
    set({ hapticFeedbackEnabled: enabled });
  },

  setEnvironment: (env) => {
    storage.set('selectedEnvironment', env);
    posthogCapture('environment switched', { environment: env });
    posthogRegister({ environment: env });
    set({ selectedEnvironment: env });
  },

  setNotificationsEnabled: (enabled) => {
    storage.set('notificationsEnabled', enabled);
    posthogCapture('notifications toggled', { enabled });
    set({ notificationsEnabled: enabled });
  },

  setNotifyOnFailures: (enabled) => {
    storage.set('notifyOnFailures', enabled);
    set({ notifyOnFailures: enabled });
  },

  setNotifyOnCompletions: (enabled) => {
    storage.set('notifyOnCompletions', enabled);
    set({ notifyOnCompletions: enabled });
  },

  setNotifyOnDelays: (enabled) => {
    storage.set('notifyOnDelays', enabled);
    set({ notifyOnDelays: enabled });
  },

  setNotifyEnvironments: (envs) => {
    storage.set('notifyEnvironments', JSON.stringify(envs));
    set({ notifyEnvironments: envs });
  },

  setQuietHoursEnabled: (enabled) => {
    storage.set('quietHoursEnabled', enabled);
    posthogCapture('quiet_hours toggled', { enabled });
    set({ quietHoursEnabled: enabled });
  },

  setQuietHoursStart: (time) => {
    storage.set('quietHoursStart', time);
    set({ quietHoursStart: time });
  },

  setQuietHoursEnd: (time) => {
    storage.set('quietHoursEnd', time);
    set({ quietHoursEnd: time });
  },

  setBiometricLockEnabled: (enabled) => {
    storage.set('biometricLockEnabled', enabled);
    posthogCapture('biometric_lock toggled', { enabled });
    set({ biometricLockEnabled: enabled });
    if (!enabled) {
      storage.set('biometricForSensitiveActions', false);
      set({ biometricForSensitiveActions: false });
    }
  },

  setBiometricForSensitiveActions: (enabled) => {
    storage.set('biometricForSensitiveActions', enabled);
    set({ biometricForSensitiveActions: enabled });
  },

  loadPreferences: () => {
    const hapticFeedbackEnabled = storage.getBoolean('hapticFeedbackEnabled') ?? true;
    const selectedEnvironment =
      (storage.getString('selectedEnvironment') as Environment) ?? 'dev';

    const notificationsEnabled = storage.getBoolean('notificationsEnabled') ?? true;
    const notifyOnFailures = storage.getBoolean('notifyOnFailures') ?? true;
    const notifyOnCompletions = storage.getBoolean('notifyOnCompletions') ?? false;
    const notifyOnDelays = storage.getBoolean('notifyOnDelays') ?? false;

    const defaultEnvs: NotifyEnvironments = { dev: false, staging: false, prod: true, preview: false };
    const envsJson = storage.getString('notifyEnvironments');
    const notifyEnvironments: NotifyEnvironments = envsJson
      ? JSON.parse(envsJson)
      : defaultEnvs;

    const quietHoursEnabled = storage.getBoolean('quietHoursEnabled') ?? false;
    const quietHoursStart = storage.getString('quietHoursStart') ?? '22:00';
    const quietHoursEnd = storage.getString('quietHoursEnd') ?? '07:00';

    const biometricLockEnabled = storage.getBoolean('biometricLockEnabled') ?? false;
    const biometricForSensitiveActions = storage.getBoolean('biometricForSensitiveActions') ?? false;

    set({
      hapticFeedbackEnabled,
      selectedEnvironment,
      notificationsEnabled,
      notifyOnFailures,
      notifyOnCompletions,
      notifyOnDelays,
      notifyEnvironments,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
      biometricLockEnabled,
      biometricForSensitiveActions,
    });
  },
}));
