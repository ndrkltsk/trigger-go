import type { Environment } from '@/stores/preferences-store';

export function isValidTokenFormat(token: string): boolean {
  return token.startsWith('tr_pat_');
}

const SECRET_KEY_PREFIXES: Record<Environment, string> = {
  dev: 'tr_dev_',
  staging: 'tr_stg_',
  prod: 'tr_prod_',
  preview: 'tr_preview_',
};

export function isValidSecretKeyFormat(key: string, env: Environment): boolean {
  return key.startsWith(SECRET_KEY_PREFIXES[env]);
}
