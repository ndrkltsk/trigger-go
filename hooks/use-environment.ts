import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePreferencesStore, type Environment } from '@/stores/preferences-store';
import { useEnvironmentsStore } from '@/stores/environments-store';

export function useEnvironment() {
  const queryClient = useQueryClient();
  const { selectedEnvironment, setEnvironment: storeSetEnvironment } = usePreferencesStore();
  const availableEnvironments = useEnvironmentsStore((s) => s.availableEnvironments);

  // Auto-correct if selected environment is not available
  useEffect(() => {
    if (!availableEnvironments.includes(selectedEnvironment)) {
      storeSetEnvironment('dev');
    }
  }, [availableEnvironments, selectedEnvironment, storeSetEnvironment]);

  const setEnvironment = useCallback(
    (env: Environment) => {
      storeSetEnvironment(env);
      queryClient.invalidateQueries();
    },
    [storeSetEnvironment, queryClient]
  );

  return {
    currentEnvironment: selectedEnvironment,
    availableEnvironments,
    setEnvironment,
  };
}
