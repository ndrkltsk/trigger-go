import { useToastStore } from '@/stores/toast-store';

export function showOfflineToast() {
  useToastStore.getState().showToast({
    type: 'warning',
    title: 'You are offline',
    message: 'This action requires an internet connection.',
  });
}
