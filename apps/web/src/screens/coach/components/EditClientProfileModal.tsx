import React from 'react';
import { Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { ClientForm } from '../client-profile.form';
import { ActionConfirmModal } from './ActionConfirmModal';
import { ArchiveSection, ResetPasswordSection } from './EditClientProfileModal.sections';
import { selectStyle, styles } from './EditClientProfileModal.styles';

const MODAL_ANIMATION = 'fade' as const;
const FIELD_FIRST_NAME: keyof ClientForm = 'firstName';
const FIELD_LAST_NAME: keyof ClientForm = 'lastName';
const FIELD_EMAIL: keyof ClientForm = 'email';
const FIELD_OBJECTIVE_ID: keyof ClientForm = 'objectiveId';
const FIELD_HEIGHT_CM: keyof ClientForm = 'heightCm';
const FIELD_WEIGHT_KG: keyof ClientForm = 'weightKg';
const FIELD_BIRTH_DATE: keyof ClientForm = 'birthDate';
const FIELD_PHONE: keyof ClientForm = 'phone';
const FIELD_SEX: keyof ClientForm = 'sex';
const KEYBOARD_EMAIL = 'email-address' as const;
const KEYBOARD_NUMERIC = 'numeric' as const;
const KEYBOARD_PHONE = 'phone-pad' as const;
const INPUT_TYPE_DATE = 'date' as const;
const SEX_UNSPECIFIED = '';
const SEX_MALE = 'male';
const SEX_FEMALE = 'female';
const SEX_OTHER = 'other';

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
        <View style={styles.card}>
          <AvatarPreview avatarUrl={props.avatarUrl} t={props.t} />
          <Header t={props.t} />
          <ScrollView contentContainerStyle={styles.form} style={styles.scroll}>
            <AvatarAction {...props} />
            <Fields {...props} />
            {props.saveError ? <ErrorMessage t={props.t} /> : null}
          </ScrollView>
          <Actions {...props} />
          <ResetPasswordSection {...props} onRequestConfirm={() => confirm.setPendingAction('reset')} />
          <ArchiveSection {...props} onRequestConfirm={() => confirm.setPendingAction('archive')} />
        </View>
      </View>
    </Modal>
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
        <Text style={styles.avatarFallbackLabel}>{props.t('coach.clientProfile.avatar.fallback')}</Text>
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
  return (
    <>
      <Input field={FIELD_FIRST_NAME} {...props} />
      <Input field={FIELD_LAST_NAME} {...props} />
      <Input field={FIELD_EMAIL} {...props} keyboardType={KEYBOARD_EMAIL} />
      <ObjectiveField {...props} />
      <Input field={FIELD_HEIGHT_CM} {...props} keyboardType={KEYBOARD_NUMERIC} />
      <Input field={FIELD_WEIGHT_KG} {...props} keyboardType={KEYBOARD_NUMERIC} />
      <DateField {...props} />
      <Input
        field={FIELD_PHONE}
        {...props}
        keyboardType={KEYBOARD_PHONE}
        placeholder={props.t('coach.clientProfile.fields.phone.placeholder')}
      />
      <SexField {...props} />
    </>
  );
}

function ObjectiveField(props: Props): React.JSX.Element {
  const error = props.errors[FIELD_OBJECTIVE_ID];
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.t('coach.clientProfile.fields.objective')}</Text>
      <select
        onChange={(event) => props.onChange(FIELD_OBJECTIVE_ID, event.target.value)}
        style={selectStyle}
        value={props.form.objectiveId}
      >
        {props.objectiveOptions.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function Input(
  props: Props & {
    field: keyof ClientForm;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    placeholder?: string;
  },
): React.JSX.Element {
  const key = `coach.clientProfile.fields.${props.field}`;
  const error = props.errors[props.field];
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.t(key)}</Text>
      <TextInput
        autoCapitalize={props.field === FIELD_EMAIL ? 'none' : 'sentences'}
        editable={props.field !== FIELD_EMAIL}
        keyboardType={props.keyboardType ?? 'default'}
        onChangeText={(value) => props.onChange(props.field, value)}
        placeholder={props.placeholder}
        style={[
          styles.input,
          props.field === FIELD_EMAIL ? styles.inputReadonly : null,
          error ? styles.inputError : null,
        ]}
        value={props.form[props.field]}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function DateField(props: Props): React.JSX.Element {
  const error = props.errors[FIELD_BIRTH_DATE];
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.t('coach.clientProfile.fields.birthDate')}</Text>
      <input
        onChange={(event) => props.onChange(FIELD_BIRTH_DATE, event.target.value)}
        style={selectStyle}
        type={INPUT_TYPE_DATE}
        value={props.form.birthDate}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function SexField(props: Props): React.JSX.Element {
  const error = props.errors[FIELD_SEX];
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.t('coach.clientProfile.fields.sex')}</Text>
      <select
        onChange={(event) => props.onChange(FIELD_SEX, event.target.value)}
        style={selectStyle}
        value={props.form.sex}
      >
        <option value={SEX_UNSPECIFIED}>{props.t('coach.clientProfile.sex.unspecified')}</option>
        <option value={SEX_MALE}>{props.t('coach.clientProfile.sex.male')}</option>
        <option value={SEX_FEMALE}>{props.t('coach.clientProfile.sex.female')}</option>
        <option value={SEX_OTHER}>{props.t('coach.clientProfile.sex.other')}</option>
      </select>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
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
