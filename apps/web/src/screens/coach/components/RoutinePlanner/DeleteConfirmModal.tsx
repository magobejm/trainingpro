import React from 'react';
import { ActionConfirmModal } from '../ActionConfirmModal';

interface DeleteConfirmModalProps {
  deletingId: string | null;
  setDeletingId: (id: string | null) => void;
  mutation: {
    isPending: boolean;
    mutate: (variables: string, options?: { onSettled?: () => void }) => void;
  };
  t: (k: string) => string;
}

export function DeleteConfirmModal({
  deletingId,
  setDeletingId,
  mutation,
  t,
}: DeleteConfirmModalProps) {
  return (
    <ActionConfirmModal
      cancelLabel={t('coach.routine.delete.cancel')}
      confirmLabel={t('coach.routine.delete.action')}
      isLoading={mutation.isPending}
      message={t('coach.routine.delete.confirm')}
      onCancel={() => setDeletingId(null)}
      onConfirm={() => {
        if (deletingId) {
          mutation.mutate(deletingId, { onSettled: () => setDeletingId(null) });
        }
      }}
      title={t('coach.routine.delete.title')}
      visible={!!deletingId}
    />
  );
}
