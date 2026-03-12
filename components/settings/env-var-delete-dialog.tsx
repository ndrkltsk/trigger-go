import { forwardRef } from 'react';
import { ConfirmSheet, type ConfirmSheetRef } from '@/components/shared/confirm-sheet';

interface EnvVarDeleteSheetProps {
  onConfirm: () => void;
  isPending: boolean;
}

export const EnvVarDeleteSheet = forwardRef<ConfirmSheetRef, EnvVarDeleteSheetProps>(
  ({ onConfirm, isPending }, ref) => {
    return (
      <ConfirmSheet
        ref={ref}
        title="Delete environment variable?"
        description="This will permanently remove the variable."
        confirmLabel="Delete"
        cancelLabel="Keep Variable"
        variant="destructive"
        isPending={isPending}
        onConfirm={onConfirm}
      />
    );
  }
);

EnvVarDeleteSheet.displayName = 'EnvVarDeleteSheet';
