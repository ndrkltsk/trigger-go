import { create } from 'zustand';
import { fetchWorkerTasks } from '@/services/api/tasks';
import { ALL_CANDIDATE_ENVIRONMENTS, type Environment } from './preferences-store';

interface EnvironmentsState {
  availableEnvironments: Environment[];
  isProbed: boolean;
  probeEnvironments: (projectRef: string) => Promise<void>;
  reset: () => void;
}

export const useEnvironmentsStore = create<EnvironmentsState>((set) => ({
  availableEnvironments: ['dev', 'prod'],
  isProbed: false,

  probeEnvironments: async (projectRef: string) => {
    const results = await Promise.allSettled(
      ALL_CANDIDATE_ENVIRONMENTS.map(async (env) => {
        await fetchWorkerTasks(projectRef, env);
        return env;
      })
    );

    const available: Environment[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        available.push(result.value);
      }
    }

    // Always include dev and prod as minimum
    if (!available.includes('dev')) available.unshift('dev');
    if (!available.includes('prod')) {
      const idx = available.indexOf('staging');
      available.splice(idx >= 0 ? idx + 1 : available.length, 0, 'prod');
    }

    set({ availableEnvironments: available, isProbed: true });
  },

  reset: () => {
    set({ availableEnvironments: ['dev', 'prod'], isProbed: false });
  },
}));
