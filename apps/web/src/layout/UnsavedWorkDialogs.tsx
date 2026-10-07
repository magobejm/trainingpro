import React from 'react';
import { Text } from 'react-native';
import { ActionConfirmModal } from '../screens/coach/components/ActionConfirmModal';
import type { useUnsavedWork } from './useUnsavedWork';

export type UnsavedDialogState = {
  conflictOpen: boolean;
  conflictVersion: number | null;
  confirmLeave: () => void;
  discardRecovery: () => void;
  dismissConflict: () => void;
  forceVersion: (version: number | null) => void;
  leaveOpen: boolean;
  recoverValue: unknown;
  restoreRecovery: () => void;
  status: ReturnType<typeof useUnsavedWork<unknown>>['status'];
  stay: () => void;
};

type Props = {
  onOverwrite: () => void;
  onReload: () => void;
  t: (key: string) => string;
  work: UnsavedDialogState;
};

const STATUS_KEY = {
  dirty: 'unsaved.dirty',
  saved: 'unsaved.saved',
  saving: 'unsaved.saving',
} as const;

export function UnsavedStatus(props: { t: (key: string) => string; work: UnsavedDialogState }): React.JSX.Element | null {
  if (props.work.status === 'clean') return null;
  return <Text style={statusStyle}>{props.t(STATUS_KEY[props.work.status])}</Text>;
}

export function UnsavedWorkDialogs(props: Props): React.JSX.Element {
  return (
    <>
      <ActionConfirmModal
        cancelLabel={props.t('unsaved.leave.stay')}
        confirmLabel={props.t('unsaved.leave.leave')}
        message={props.t('unsaved.leave.message')}
        onCancel={props.work.stay}
        onConfirm={props.work.confirmLeave}
        title={props.t('unsaved.leave.title')}
        visible={props.work.leaveOpen}
      />
      <ActionConfirmModal
        cancelLabel={props.t('unsaved.recover.discard')}
        confirmLabel={props.t('unsaved.recover.restore')}
        message={props.t('unsaved.recover.message')}
        onCancel={props.work.discardRecovery}
        onConfirm={props.work.restoreRecovery}
        title={props.t('unsaved.recover.title')}
        visible={props.work.recoverValue != null}
      />
      <ActionConfirmModal
        cancelLabel={props.t('unsaved.conflict.reload')}
        confirmLabel={props.t('unsaved.conflict.overwrite')}
        message={props.t('unsaved.conflict.message')}
        onCancel={() => {
          props.work.dismissConflict();
          props.onReload();
        }}
        onConfirm={() => {
          props.work.forceVersion(props.work.conflictVersion);
          props.work.dismissConflict();
          props.onOverwrite();
        }}
        title={props.t('unsaved.conflict.title')}
        visible={props.work.conflictOpen}
      />
    </>
  );
}

const statusStyle = { color: '#9a6700', fontSize: 13, fontWeight: '600' as const, marginBottom: 8 };
