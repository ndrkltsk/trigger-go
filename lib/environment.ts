import type { Environment } from '@/stores/preferences-store';

/** Short labels: Dev, Staging, Prod, Preview */
export const ENV_LABELS: Record<Environment, string> = {
  dev: 'Dev',
  staging: 'Staging',
  prod: 'Prod',
  preview: 'Preview',
};

/** Full labels: Development, Staging, Production, Preview */
export const ENV_FULL_LABELS: Record<Environment, string> = {
  dev: 'Development',
  staging: 'Staging',
  prod: 'Production',
  preview: 'Preview',
};

/** Hex color per environment */
export const ENV_COLORS: Record<Environment, string> = {
  dev: '#3b82f6',
  staging: '#f59e0b',
  prod: '#22c55e',
  preview: '#a855f7',
};

/** Tailwind bg-* classes for dot indicators */
export const ENV_DOT_COLORS: Record<Environment, string> = {
  dev: 'bg-blue-500',
  staging: 'bg-amber-500',
  prod: 'bg-green-500',
  preview: 'bg-purple-500',
};

/** Tailwind text-* classes */
export const ENV_TEXT_COLORS: Record<Environment, string> = {
  dev: 'text-blue-500',
  staging: 'text-amber-500',
  prod: 'text-green-500',
  preview: 'text-purple-500',
};
