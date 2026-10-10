import React, { useRef } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useDialogFocus } from '../../../layout/useDialogFocus';
import { CreateClientAvatarPicker } from './CreateClientAvatarPicker';

const EMAIL_PROPS = {
  autoCapitalize: 'none' as const,
  keyboardType: 'email-address' as const,
};
const MODAL_ANIMATION = 'fade' as const;

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

export function CreateClientModal(props: Props): React.JSX.Element {
  const cardRef = useRef<View>(null);
  useDialogFocus(props.visible, cardRef);
  return (
    <Modal animationType={MODAL_ANIMATION} onRequestClose={props.onClose} transparent visible={props.visible}>
      <View style={styles.overlay}>
        <View ref={cardRef} style={styles.card}>
          <ModalHeader t={props.t} />
          <ModalFields {...props} />
          <ModalActions {...props} />
        </View>
      </View>
    </Modal>
  );
}

function ModalHeader(props: Pick<Props, 't'>): React.JSX.Element {
  return (
    <>
      <Text style={styles.title}>{props.t('coach.clients.modal.title')}</Text>
      <Text style={styles.subtitle}>{props.t('coach.clients.modal.subtitle')}</Text>
    </>
  );
}

function ModalFields(props: Props): React.JSX.Element {
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

function TextFields(props: Props): React.JSX.Element {
  return (
    <>
      <LabeledInput
        label={props.t('coach.clients.form.firstName')}
        onChangeText={props.onFirstNameChange}
        value={props.firstName}
      />
      <LabeledInput
        label={props.t('coach.clients.form.lastName')}
        onChangeText={props.onLastNameChange}
        value={props.lastName}
      />
    </>
  );
}

function EmailFields(props: Props): React.JSX.Element {
  return (
    <>
      <LabeledInput
        {...EMAIL_PROPS}
        error={props.emailMismatch}
        label={props.t('coach.clients.form.email')}
        onChangeText={props.onEmailChange}
        value={props.email}
      />
      <LabeledInput
        {...EMAIL_PROPS}
        error={props.emailMismatch}
        label={props.t('coach.clients.form.confirmEmail')}
        onChangeText={props.onConfirmEmailChange}
        value={props.confirmEmail}
      />
      {props.emailMismatch ? <Text style={styles.error}>{props.t('coach.clients.form.confirmEmailMismatch')}</Text> : null}
    </>
  );
}

function ObjectiveField(props: Props): React.JSX.Element {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.t('coach.clients.form.objective')}</Text>
      <select
        aria-label={props.t('coach.clients.form.objective')}
        onChange={(event) => props.onObjectiveChange(event.target.value)}
        style={selectStyle}
        value={props.objectiveId}
      >
        {props.objectiveOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </View>
  );
}

function ModalActions(props: Props): React.JSX.Element {
  return (
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" onPress={props.onClose} style={styles.cancelButton}>
        <Text style={styles.cancelLabel}>{props.t('coach.clients.modal.cancel')}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={!props.isFormValid || props.isSubmitting}
        onPress={props.onCreate}
        style={[styles.submitButton, !props.isFormValid ? styles.submitButtonDisabled : null]}
      >
        <Text style={styles.submitLabel}>{submitLabel(props)}</Text>
      </Pressable>
    </View>
  );
}

function LabeledInput(props: {
  autoCapitalize?: 'none';
  error?: boolean;
  keyboardType?: 'email-address';
  label: string;
  onChangeText: (value: string) => void;
  value: string;
}): React.JSX.Element {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        accessibilityLabel={props.label}
        autoCapitalize={props.autoCapitalize}
        keyboardType={props.keyboardType}
        onChangeText={props.onChangeText}
        style={[styles.input, props.error ? styles.inputError : null]}
        value={props.value}
      />
    </View>
  );
}

function submitLabel(props: Props): string {
  return props.isSubmitting ? props.t('coach.clients.modal.creating') : props.t('coach.clients.form.submit');
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: '#eff4ff',
    borderColor: '#d4e2f5',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 14,
  },
  cancelLabel: {
    color: '#2f4f7d',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#d8e3f2',
    borderRadius: 16,
    borderWidth: 1,
    gap: 9,
    maxWidth: 450,
    padding: 18,
    width: '100%',
  },
  field: {
    gap: 4,
  },
  label: {
    color: '#5e7088',
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#f4f8ff',
    borderColor: '#d4e0ef',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputError: {
    borderColor: '#d64242',
  },
  error: {
    color: '#b42318',
    fontSize: 12,
    marginTop: -2,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(9, 16, 28, 0.4)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#1c74e9',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 14,
  },
  submitButtonDisabled: {
    opacity: 0.55,
  },
  submitLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  subtitle: {
    color: '#627285',
    fontSize: 13,
    marginBottom: 4,
  },
  title: {
    color: '#111418',
    fontSize: 21,
    fontWeight: '800',
  },
});

const selectStyle = {
  backgroundColor: '#f4f8ff',
  border: '1px solid #d4e0ef',
  borderRadius: 10,
  boxSizing: 'border-box' as const,
  color: '#1b2434',
  minHeight: 40,
  padding: '8px 12px',
  width: '100%',
};
