import { forwardRef } from 'react';
import { ConfirmSheet, type ConfirmSheetRef } from '@/components/shared/confirm-sheet';

interface CancelConfirmSheetProps {
  onConfirm: () => void;
  isPending: boolean;
}

export const CancelConfirmSheet = forwardRef<ConfirmSheetRef, CancelConfirmSheetProps>(
  ({ onConfirm, isPending }, ref) => {
    return (
      <ConfirmSheet
        ref={ref}
        title="Cancel this run?"
        description="This will stop the run immediately. Any in-progress child runs will also be canceled. This cannot be undone."
        confirmLabel="Cancel Run"
        cancelLabel="Keep Running"
        variant="destructive"
        isPending={isPending}
        onConfirm={onConfirm}
      />
    );
  }
);

CancelConfirmSheet.displayName = 'CancelConfirmSheet';
