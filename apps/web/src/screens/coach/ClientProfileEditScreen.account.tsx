import React from 'react';
import { Text, View } from 'react-native';
import { Button, useToast } from '@trainerpro/ui';
import { ActionConfirmModal } from './components/ActionConfirmModal';
import { styles } from './ClientProfileEditScreen.styles';
import type { Labels } from './ClientProfileEditScreen.labels';
import type { useClientProfileEditState } from './ClientProfileEditScreen.hooks';

const VARIANT_SECONDARY = 'secondary' as const;
const VARIANT_DANGER = 'danger' as const;

type Vm = ReturnType<typeof useClientProfileEditState>;
type Translate = (key: string, options?: Record<string, unknown>) => string;

export function AccountCard(props: { labels: Labels; onArchived?: () => void; t: Translate; vm: Vm }): React.JSX.Element {
  const confirm = useAccountActionConfirm(props);
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{props.labels.accountTitle}</Text>
      <View style={styles.row}>
        <Button label={props.labels.resetPassword} onPress={confirm.requestReset} variant={VARIANT_SECONDARY} />
        <Button label={props.labels.archiveClient} onPress={confirm.requestArchive} variant={VARIANT_DANGER} />
      </View>
      {props.vm.state.tempPassword ? (
        <Text style={styles.helperText}>{props.labels.tempPasswordLine(props.vm.state.tempPassword)}</Text>
      ) : null}
      <AccountActionConfirm confirm={confirm} t={props.t} />
    </View>
  );
}

function useAccountActionConfirm(props: { onArchived?: () => void; t: Translate; vm: Vm }) {
  const [pendingAction, setPendingAction] = React.useState<'' | 'archive' | 'reset'>('');
  const toast = useToast();
  const onConfirm = () => executeAccountAction(pendingAction, { ...props, onDone: toast.success }, setPendingAction);
  return {
    message:
      pendingAction === 'archive'
        ? props.t('coach.clientProfile.archive.confirm')
        : props.t('coach.clientProfile.resetPassword.confirm'),
    onCancel: () => setPendingAction(''),
    onConfirm,
    requestArchive: () => setPendingAction('archive'),
    requestReset: () => setPendingAction('reset'),
    visible: Boolean(pendingAction),
  };
}

function AccountActionConfirm(props: {
  confirm: ReturnType<typeof useAccountActionConfirm>;
  t: Translate;
}): React.JSX.Element {
  return (
    <ActionConfirmModal
      cancelLabel={props.t('common.cancel')}
      confirmLabel={props.t('coach.library.confirm.button')}
      message={props.confirm.message}
      onCancel={props.confirm.onCancel}
      onConfirm={props.confirm.onConfirm}
      title={props.t('coach.library.confirm.title')}
      visible={props.confirm.visible}
    />
  );
}

function executeAccountAction(
  pendingAction: '' | 'archive' | 'reset',
  props: { onArchived?: () => void; onDone: (message: string) => unknown; t: Translate; vm: Vm },
  setPendingAction: (value: '' | 'archive' | 'reset') => void,
): void {
  if (pendingAction === 'archive') {
    void props.vm.actions.archiveClient().then(() => {
      setPendingAction('');
      props.onDone(props.t('coach.clientProfile.archive.toast'));
      props.onArchived?.();
    });
    return;
  }
  if (pendingAction === 'reset') {
    void resetPassword(props.vm).then(() => {
      setPendingAction('');
      props.onDone(props.t('coach.clientProfile.resetPassword.toast'));
    });
  }
}

function resetPassword(vm: Vm): Promise<void> {
  return vm.actions.resetPassword().then((result) => {
    vm.state.setTempPassword((result as { temporaryPassword: string }).temporaryPassword);
  }) as Promise<void>;
}
