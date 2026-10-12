import React from 'react';
import { Image, Text, View } from 'react-native';
import { Button, Modal } from '@trainerpro/ui';
import type { ClientForm } from '../client-profile.form';
import { ActionConfirmModal } from './ActionConfirmModal';
import { ProfileFieldsSection } from './EditClientProfileModal.fields';
import { ArchiveSection, ResetPasswordSection } from './EditClientProfileModal.sections';
import { styles } from './EditClientProfileModal.styles';

type FieldErrors = Partial<Record<keyof ClientForm, string>>;
type ObjectiveOption = { id: string; label: string };

type Props = {
  avatarUrl: null | string;
  errors: FieldErrors;
  form: ClientForm;
  isArchiving: boolean;
  isResettingPassword: boolean;
  isSaving: boolean;
  isUploading: boolean;
  onArchive: () => void;
  onChange: (key: keyof ClientForm, value: string) => void;
  onClose: () => void;
  onPickRandomAvatar: () => void;
  onResetPassword: () => void;
  onSave: () => void;
  onUploadAvatar: () => void;
  objectiveOptions: ObjectiveOption[];
  resetPassword: null | string;
  saveError: boolean;
  t: (key: string, params?: Record<string, number | string>) => string;
  visible: boolean;
};

export function EditClientProfileModal(props: Props): React.JSX.Element {
  const confirm = useConfirmState(props);
  return renderModalContent(props, confirm);
}

function useConfirmState(props: Props) {
  const [pendingAction, setPendingAction] = React.useState<'' | 'archive' | 'reset'>('');
  return {
    confirmKey:
      pendingAction === 'archive' ? 'coach.clientProfile.archive.confirm' : 'coach.clientProfile.resetPassword.confirm',
    onConfirm: () => runConfirmedAction(pendingAction, props, setPendingAction),
    pendingAction,
    setPendingAction,
  };
}

function renderModalContent(props: Props, confirm: ReturnType<typeof useConfirmState>): React.JSX.Element {
  return (
    <>
      {renderMainModal(props, confirm)}
      {renderConfirmModal(props, confirm)}
    </>
  );
}

function renderMainModal(props: Props, confirm: ReturnType<typeof useConfirmState>): React.JSX.Element {
  return (
    <Modal
      closeLabel={props.t('common.close')}
      footer={<Actions {...props} />}
      onClose={props.onClose}
      size="md"
      title={props.t('coach.clientProfile.edit.title')}
      visible={props.visible}
    >
      <MainCard confirm={confirm} props={props} />
    </Modal>
  );
}

function MainCard(props: { confirm: ReturnType<typeof useConfirmState>; props: Props }): React.JSX.Element {
  return (
    <View>
      <AvatarPreview avatarUrl={props.props.avatarUrl} t={props.props.t} />
      <Text style={styles.subtitle}>{props.props.t('coach.clientProfile.edit.subtitle')}</Text>
      <View style={styles.form}>
        <AvatarAction {...props.props} />
        <Fields {...props.props} />
        {props.props.saveError ? <ErrorMessage t={props.props.t} /> : null}
      </View>
      <ResetPasswordSection {...props.props} onRequestConfirm={() => props.confirm.setPendingAction('reset')} />
      <ArchiveSection {...props.props} onRequestConfirm={() => props.confirm.setPendingAction('archive')} />
    </View>
  );
}

function renderConfirmModal(props: Props, confirm: ReturnType<typeof useConfirmState>): React.JSX.Element {
  return (
    <ActionConfirmModal
      cancelLabel={props.t('coach.clients.modal.cancel')}
      confirmLabel={props.t('coach.library.confirm.button')}
      message={props.t(confirm.confirmKey)}
      onCancel={() => confirm.setPendingAction('')}
      onConfirm={confirm.onConfirm}
      title={props.t('coach.library.confirm.title')}
      visible={Boolean(confirm.pendingAction)}
    />
  );
}

function runConfirmedAction(
  pendingAction: '' | 'archive' | 'reset',
  props: Props,
  setPendingAction: (value: '' | 'archive' | 'reset') => void,
): void {
  if (pendingAction === 'archive') props.onArchive();
  if (pendingAction === 'reset') props.onResetPassword();
  setPendingAction('');
}

function AvatarPreview(props: { avatarUrl: null | string; t: (key: string) => string }): React.JSX.Element {
  if (!props.avatarUrl) {
    return (
      <View style={styles.avatarFallback}>
        <Text style={styles.avatarFallbackLabel}>{props.t('coach.clientProfile.avatar.fallback')}</Text>
      </View>
    );
  }
  return <Image source={{ uri: props.avatarUrl }} style={styles.avatarImage} />;
}

function AvatarAction(props: Props): React.JSX.Element {
  return (
    <View style={styles.avatarActions}>
      <Button
        label={
          props.isUploading ? props.t('coach.clientProfile.avatar.uploading') : props.t('coach.clientProfile.avatar.upload')
        }
        loading={props.isUploading}
        onPress={props.onUploadAvatar}
        style={styles.avatarButton}
        variant="secondary"
      />
      <Button
        label={props.t('coach.clientProfile.avatar.random')}
        onPress={props.onPickRandomAvatar}
        style={styles.avatarButton}
        variant="secondary"
      />
    </View>
  );
}

function Fields(props: Props): React.JSX.Element {
  return <ProfileFieldsSection {...props} />;
}

function Actions(props: Props): React.JSX.Element {
  return (
    <>
      <Button label={props.t('coach.clientProfile.edit.cancel')} onPress={props.onClose} variant="secondary" />
      <Button
        label={props.isSaving ? props.t('coach.clientProfile.saving') : props.t('coach.clientProfile.edit.save')}
        loading={props.isSaving}
        onPress={props.onSave}
      />
    </>
  );
}

function ErrorMessage(props: Pick<Props, 't'>): React.JSX.Element {
  return <Text style={styles.error}>{props.t('coach.clientProfile.saveError')}</Text>;
}
