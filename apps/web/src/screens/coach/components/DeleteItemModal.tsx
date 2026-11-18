import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActionConfirmModal } from './ActionConfirmModal';

type Props = {
  error: null | string;
  isLoading: boolean;
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
  visible: boolean;
};

/** Confirmation shown before removing a coach-owned library item. */
export function DeleteItemModal(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <ActionConfirmModal
      cancelLabel={t('common.cancel')}
      confirmLabel={t('coach.library.exercises.actions.delete')}
      errorMessage={props.error}
      isLoading={props.isLoading}
      message={t('coach.library.deleteConfirm.message', { name: props.name })}
      onCancel={props.onCancel}
      onConfirm={props.onConfirm}
      title={t('coach.library.deleteConfirm.title')}
      visible={props.visible}
    />
  );
}
