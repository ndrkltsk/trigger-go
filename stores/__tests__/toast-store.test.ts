import { useToastStore, useToast } from '@/stores/toast-store';

describe('toast-store', () => {
  beforeEach(() => {
    useToastStore.setState({ toast: null });
  });

  it('starts with no toast', () => {
    expect(useToastStore.getState().toast).toBeNull();
  });

  it('shows a success toast', () => {
    useToastStore.getState().showToast({
      type: 'success',
      title: 'Done!',
    });
    const toast = useToastStore.getState().toast;
    expect(toast).not.toBeNull();
    expect(toast?.type).toBe('success');
    expect(toast?.title).toBe('Done!');
    expect(toast?.duration).toBe(3000);
  });

  it('shows an error toast', () => {
    useToastStore.getState().showToast({
      type: 'error',
      title: 'Failed',
      message: 'Something went wrong',
    });
    const toast = useToastStore.getState().toast;
    expect(toast?.type).toBe('error');
    expect(toast?.message).toBe('Something went wrong');
  });

  it('uses longer duration for toasts with action', () => {
    useToastStore.getState().showToast({
      type: 'success',
      title: 'Replayed',
      action: { label: 'View', onPress: jest.fn() },
    });
    const toast = useToastStore.getState().toast;
    expect(toast?.duration).toBe(5000);
  });

  it('allows custom duration', () => {
    useToastStore.getState().showToast({
      type: 'info',
      title: 'Info',
      duration: 10000,
    });
    const toast = useToastStore.getState().toast;
    expect(toast?.duration).toBe(10000);
  });

  it('dismisses the toast', () => {
    useToastStore.getState().showToast({
      type: 'info',
      title: 'Test',
    });
    expect(useToastStore.getState().toast).not.toBeNull();
    useToastStore.getState().dismissToast();
    expect(useToastStore.getState().toast).toBeNull();
  });

  it('each toast gets a unique id', () => {
    useToastStore.getState().showToast({ type: 'info', title: 'First' });
    const firstId = useToastStore.getState().toast?.id;
    useToastStore.getState().showToast({ type: 'info', title: 'Second' });
    const secondId = useToastStore.getState().toast?.id;
    expect(firstId).not.toBe(secondId);
  });
});
