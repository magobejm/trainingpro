import React, { useRef } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useDialogFocus } from '../../../layout/useDialogFocus';
import { CreateClientAvatarPicker } from './CreateClientAvatarPicker';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

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
    gap: space.md,
    justifyContent: 'flex-end',
    marginTop: space.sm,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: space.lg,
  },
  cancelLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: space.sm,
    maxWidth: 450,
    padding: space.lg,
    width: '100%',
  },
  field: {
    gap: space.xs,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.xs,
    marginTop: -2,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(9, 16, 28, 0.4)',
    flex: 1,
    justifyContent: 'center',
    padding: space.xl,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: space.lg,
  },
  submitButtonDisabled: {
    opacity: 0.55,
  },
  submitLabel: {
    color: colors.surface,
    fontSize: fontSize.xs,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: space.xs,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
});

const selectStyle = {
  backgroundColor: colors.primarySoft,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  boxSizing: 'border-box' as const,
  color: colors.text,
  minHeight: 40,
  padding: '8px 12px',
  width: '100%',
};
