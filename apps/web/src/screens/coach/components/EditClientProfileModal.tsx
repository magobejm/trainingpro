import React from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import type { ClientForm } from '../client-profile.form';
import { ActionConfirmModal } from './ActionConfirmModal';
import { ProfileFieldsSection } from './EditClientProfileModal.fields';
import { ArchiveSection, ResetPasswordSection } from './EditClientProfileModal.sections';
import { styles } from './EditClientProfileModal.styles';

const MODAL_ANIMATION = 'fade' as const;

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
      pendingAction === 'archive'
        ? 'coach.clientProfile.archive.confirm'
        : 'coach.clientProfile.resetPassword.confirm',
    onConfirm: () => runConfirmedAction(pendingAction, props, setPendingAction),
    pendingAction,
    setPendingAction,
  };
}

function renderModalContent(
  props: Props,
  confirm: ReturnType<typeof useConfirmState>,
): React.JSX.Element {
  return (
    <>
      {renderMainModal(props, confirm)}
      {renderConfirmModal(props, confirm)}
    </>
  );
}

function renderMainModal(
  props: Props,
  confirm: ReturnType<typeof useConfirmState>,
): React.JSX.Element {
  return (
    <Modal
      animationType={MODAL_ANIMATION}
      onRequestClose={props.onClose}
      transparent
      visible={props.visible}
    >
      <View style={styles.overlay}>
        <MainCard confirm={confirm} props={props} />
      </View>
    </Modal>
  );
}

function MainCard(props: {
  confirm: ReturnType<typeof useConfirmState>;
  props: Props;
}): React.JSX.Element {
  return (
    <View style={styles.card}>
      <AvatarPreview avatarUrl={props.props.avatarUrl} t={props.props.t} />
      <Header t={props.props.t} />
      <ScrollView contentContainerStyle={styles.form} style={styles.scroll}>
        <AvatarAction {...props.props} />
        <Fields {...props.props} />
        {props.props.saveError ? <ErrorMessage t={props.props.t} /> : null}
      </ScrollView>
      <Actions {...props.props} />
      <ResetPasswordSection
        {...props.props}
        onRequestConfirm={() => props.confirm.setPendingAction('reset')}
      />
      <ArchiveSection
        {...props.props}
        onRequestConfirm={() => props.confirm.setPendingAction('archive')}
      />
    </View>
  );
}

function renderConfirmModal(
  props: Props,
  confirm: ReturnType<typeof useConfirmState>,
): React.JSX.Element {
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

function AvatarPreview(props: {
  avatarUrl: null | string;
  t: (key: string) => string;
}): React.JSX.Element {
  if (!props.avatarUrl) {
    return (
      <View style={styles.avatarFallback}>
        <Text style={styles.avatarFallbackLabel}>
          {props.t('coach.clientProfile.avatar.fallback')}
        </Text>
      </View>
    );
  }
  return <Image source={{ uri: props.avatarUrl }} style={styles.avatarImage} />;
}

function Header(props: Pick<Props, 't'>): React.JSX.Element {
  return (
    <>
      <Text style={styles.title}>{props.t('coach.clientProfile.edit.title')}</Text>
      <Text style={styles.subtitle}>{props.t('coach.clientProfile.edit.subtitle')}</Text>
    </>
  );
}

function AvatarAction(props: Props): React.JSX.Element {
  return (
    <View style={styles.avatarActions}>
      <Pressable onPress={props.onUploadAvatar} style={styles.avatarButton}>
        <Text style={styles.avatarLabel}>
          {props.isUploading
            ? props.t('coach.clientProfile.avatar.uploading')
            : props.t('coach.clientProfile.avatar.upload')}
        </Text>
      </Pressable>
      <Pressable onPress={props.onPickRandomAvatar} style={styles.avatarButton}>
        <Text style={styles.avatarLabel}>{props.t('coach.clientProfile.avatar.random')}</Text>
      </Pressable>
    </View>
  );
}

function Fields(props: Props): React.JSX.Element {
  return <ProfileFieldsSection {...props} />;
}

function Actions(props: Props): React.JSX.Element {
  return (
    <View style={styles.actions}>
      <Pressable onPress={props.onClose} style={styles.cancelButton}>
        <Text style={styles.cancelLabel}>{props.t('coach.clientProfile.edit.cancel')}</Text>
      </Pressable>
      <Pressable onPress={props.onSave} style={styles.saveButton}>
        <Text style={styles.saveLabel}>
          {props.isSaving
            ? props.t('coach.clientProfile.saving')
            : props.t('coach.clientProfile.edit.save')}
        </Text>
      </Pressable>
    </View>
  );
}

function ErrorMessage(props: Pick<Props, 't'>): React.JSX.Element {
  return <Text style={styles.error}>{props.t('coach.clientProfile.saveError')}</Text>;
}
