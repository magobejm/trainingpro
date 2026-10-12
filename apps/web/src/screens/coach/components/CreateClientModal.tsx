import React, { useState } from 'react';
import { Text } from 'react-native';
import { Button, Modal, Select, TextField, colors, fontSize, space } from '@trainerpro/ui';
import { CreateClientAvatarPicker } from './CreateClientAvatarPicker';

const EMAIL_PROPS = {
  autoCapitalize: 'none' as const,
  keyboardType: 'email-address' as const,
};

type Props = {
  availableAvatars: string[];
  avatarUrl: string;
  confirmEmail: string;
  email: string;
  emailMismatch: boolean;
  firstName: string;
  isFormValid: boolean;
  isSubmitting: boolean;
  lastName: string;
  objectiveId: string;
  objectiveOptions: Array<{ id: string; label: string }>;
  onClose: () => void;
  onConfirmEmailChange: (value: string) => void;
  onCreate: () => void;
  onEmailChange: (value: string) => void;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onObjectiveChange: (value: string) => void;
  onSelectAvatar: (value: string) => void;
  t: (key: string) => string;
  visible: boolean;
};

type FieldsProps = Props & { submitted: boolean };

export function CreateClientModal(props: Props): React.JSX.Element {
  const [submitted, setSubmitted] = useState(false);
  function handleCreate(): void {
    setSubmitted(true);
    if (props.isFormValid) props.onCreate();
  }
  return (
    <Modal
      closeLabel={props.t('common.close')}
      footer={<ModalActions {...props} onCreate={handleCreate} />}
      onClose={props.onClose}
      size="sm"
      title={props.t('coach.clients.modal.title')}
      visible={props.visible}
    >
      <Text style={styles.subtitle}>{props.t('coach.clients.modal.subtitle')}</Text>
      <ModalFields {...props} submitted={submitted} />
    </Modal>
  );
}

const styles = {
  gap: { marginBottom: space.md },
  subtitle: { color: colors.textMuted, fontSize: fontSize.sm, marginBottom: space.md },
};

function ModalFields(props: FieldsProps): React.JSX.Element {
  return (
    <>
      <EmailFields {...props} />
      <TextFields {...props} />
      <ObjectiveField {...props} />
      <CreateClientAvatarPicker
        avatars={props.availableAvatars}
        onSelect={props.onSelectAvatar}
        selectedAvatarUrl={props.avatarUrl}
        t={props.t}
      />
    </>
  );
}

function requiredError(props: FieldsProps, value: string): string | null {
  return props.submitted && value.trim().length === 0 ? props.t('coach.clientProfile.validation.required') : null;
}

function TextFields(props: FieldsProps): React.JSX.Element {
  return (
    <>
      <TextField
        accessibilityLabel={props.t('coach.clients.form.firstName')}
        containerStyle={styles.gap}
        error={requiredError(props, props.firstName)}
        label={props.t('coach.clients.form.firstName')}
        onChangeText={props.onFirstNameChange}
        required
        value={props.firstName}
      />
      <TextField
        accessibilityLabel={props.t('coach.clients.form.lastName')}
        containerStyle={styles.gap}
        error={requiredError(props, props.lastName)}
        label={props.t('coach.clients.form.lastName')}
        onChangeText={props.onLastNameChange}
        required
        value={props.lastName}
      />
    </>
  );
}

function EmailFields(props: FieldsProps): React.JSX.Element {
  const mismatch = props.emailMismatch ? props.t('coach.clients.form.confirmEmailMismatch') : null;
  return (
    <>
      <TextField
        {...EMAIL_PROPS}
        containerStyle={styles.gap}
        error={mismatch ?? requiredError(props, props.email)}
        label={props.t('coach.clients.form.email')}
        onChangeText={props.onEmailChange}
        required
        value={props.email}
      />
      <TextField
        {...EMAIL_PROPS}
        containerStyle={styles.gap}
        error={mismatch ?? requiredError(props, props.confirmEmail)}
        label={props.t('coach.clients.form.confirmEmail')}
        onChangeText={props.onConfirmEmailChange}
        required
        value={props.confirmEmail}
      />
    </>
  );
}

function ObjectiveField(props: Props): React.JSX.Element {
  return (
    <Select
      containerStyle={styles.gap}
      label={props.t('coach.clients.form.objective')}
      onChange={props.onObjectiveChange}
      options={props.objectiveOptions.map((option) => ({ label: option.label, value: option.id }))}
      value={props.objectiveId}
    />
  );
}

function ModalActions(props: Props): React.JSX.Element {
  return (
    <>
      <Button label={props.t('coach.clients.modal.cancel')} onPress={props.onClose} variant="secondary" />
      <Button label={submitLabel(props)} loading={props.isSubmitting} onPress={props.onCreate} />
    </>
  );
}

function submitLabel(props: Props): string {
  return props.isSubmitting ? props.t('coach.clients.modal.creating') : props.t('coach.clients.form.submit');
}
