import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ActionConfirmModal } from './components/ActionConfirmModal';
import { styles } from './ClientProfileEditScreen.styles';
import type { Labels } from './ClientProfileEditScreen.labels';
import type { useClientProfileEditState } from './ClientProfileEditScreen.hooks';

type Vm = ReturnType<typeof useClientProfileEditState>;
type Translate = (key: string, options?: Record<string, unknown>) => string;

export function AccountCard(props: {
  labels: Labels;
  onArchived?: () => void;
  t: Translate;
  vm: Vm;
}): React.JSX.Element {
  const confirm = useAccountActionConfirm(props);
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{props.labels.accountTitle}</Text>
      <View style={styles.row}>
        <Pressable onPress={confirm.requestReset} style={styles.secondaryButton}>
          <Text style={styles.secondaryLabel}>{props.labels.resetPassword}</Text>
        </Pressable>
        <Pressable onPress={confirm.requestArchive} style={styles.dangerButton}>
          <Text style={styles.dangerLabel}>{props.labels.archiveClient}</Text>
        </Pressable>
      </View>
      {props.vm.state.tempPassword ? (
        <Text style={styles.helperText}>
          {props.labels.tempPasswordLine(props.vm.state.tempPassword)}
        </Text>
      ) : null}
      <AccountActionConfirm confirm={confirm} t={props.t} />
    </View>
  );
}

function useAccountActionConfirm(props: { onArchived?: () => void; t: Translate; vm: Vm }) {
  const [pendingAction, setPendingAction] = React.useState<'' | 'archive' | 'reset'>('');
  const onConfirm = () => executeAccountAction(pendingAction, props, setPendingAction);
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
  props: { onArchived?: () => void; vm: Vm },
  setPendingAction: (value: '' | 'archive' | 'reset') => void,
): void {
  if (pendingAction === 'archive') {
    void props.vm.actions.archiveClient().then(() => {
      setPendingAction('');
      props.onArchived?.();
    });
    return;
  }
  if (pendingAction === 'reset') {
    void resetPassword(props.vm).then(() => setPendingAction(''));
  }
}

function resetPassword(vm: Vm): Promise<void> {
  return vm.actions.resetPassword().then((result) => {
    vm.state.setTempPassword((result as { temporaryPassword: string }).temporaryPassword);
  }) as Promise<void>;
}
