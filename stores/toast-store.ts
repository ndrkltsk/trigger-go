import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  action?: ToastAction;
  duration?: number;
}

interface ToastState {
  toast: ToastMessage | null;
  showToast: (options: Omit<ToastMessage, 'id'>) => void;
  dismissToast: () => void;
}

let toastId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toast: null,

  showToast: (options) => {
    toastId += 1;
    set({
      toast: {
        id: String(toastId),
        duration: options.action ? 5000 : 3000,
        ...options,
      },
    });
  },

  dismissToast: () => set({ toast: null }),
}));

export function useToast() {
  const showToast = useToastStore((s) => s.showToast);
  return { showToast };
}
