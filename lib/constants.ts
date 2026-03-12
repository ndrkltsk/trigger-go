export const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.trigger.dev';
export const DEFAULT_PAGE_SIZE = 25;
export const POLLING_INTERVALS = {
  RUNS_LIST: 15_000,
  RUN_DETAIL_ACTIVE: 5_000,
  DEPLOYMENTS: 30_000,
  DASHBOARD: 30_000,
} as const;
