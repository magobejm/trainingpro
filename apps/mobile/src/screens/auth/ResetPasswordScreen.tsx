import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { validateNewPassword, type PasswordIssue } from '@trainerpro/shared';
import '../../i18n';
import { useCompleteRecoveryMutation } from '../../data/hooks/useAuthMutations';
import { usePasswordRecoveryStore } from '../../store/password-recovery.store';
import { LIGHT } from '../../theme/light';

const ACCESSIBILITY_ROLE_BUTTON = 'button' as const;
const PLACEHOLDER_COLOR = LIGHT.accentMuted;
const ISSUE_KEYS: Record<PasswordIssue, string> = {
  mismatch: 'auth.reset.mismatch',
  tooShort: 'auth.reset.tooShort',
};

export function ResetPasswordScreen(): React.JSX.Element {
  const phase = usePasswordRecoveryStore((state) => state.phase);
  return phase === 'ready' ? <NewPasswordCard /> : <InvalidLinkCard />;
}

function InvalidLinkCard(): React.JSX.Element {
  const { t } = useTranslation();
  const dismiss = usePasswordRecoveryStore((state) => state.dismiss);
  return (
    <AuthCard>
      <Text style={styles.title}>{t('auth.reset.invalid.title')}</Text>
      <Text style={styles.subtitle}>{t('auth.reset.invalid.message')}</Text>
      <Pressable accessibilityRole={ACCESSIBILITY_ROLE_BUTTON} onPress={dismiss} style={styles.button}>
        <Text style={styles.buttonText}>{t('auth.reset.backToLogin')}</Text>
      </Pressable>
    </AuthCard>
  );
}

function NewPasswordCard(): React.JSX.Element {
  const form = useNewPasswordForm();
  const passwordError = form.issue === 'tooShort' ? form.issueText : null;
  const confirmError = form.issue === 'mismatch' ? form.issueText : null;
  return (
    <AuthCard>
      <Text style={styles.title}>{form.t('auth.reset.title')}</Text>
      <Text style={styles.subtitle}>{form.t('auth.reset.subtitle')}</Text>
      <PasswordField
        error={passwordError}
        label={form.t('auth.reset.password.placeholder')}
        onChangeText={form.setPassword}
        value={form.password}
      />
      <PasswordField
        error={confirmError}
        label={form.t('auth.reset.confirm.placeholder')}
        onChangeText={form.setConfirmation}
        value={form.confirmation}
      />
      {form.message ? <Text style={styles.error}>{form.message}</Text> : null}
      <Pressable accessibilityRole={ACCESSIBILITY_ROLE_BUTTON} onPress={form.onSubmit} style={styles.button}>
        {form.isSaving ? (
          <ActivityIndicator color={LIGHT.textOnNavy} />
        ) : (
          <Text style={styles.buttonText}>{form.t('auth.reset.submit')}</Text>
        )}
      </Pressable>
    </AuthCard>
  );
}

function useNewPasswordForm() {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [issue, setIssue] = useState<PasswordIssue | null>(null);
  const accessToken = usePasswordRecoveryStore((state) => state.accessToken);
  const refreshToken = usePasswordRecoveryStore((state) => state.refreshToken);
  const finish = usePasswordRecoveryStore((state) => state.finish);
  const mutation = useCompleteRecoveryMutation();
  const onSubmit = (): void => {
    if (mutation.isPending || !accessToken || !refreshToken) return;
    const found = validateNewPassword(password, confirmation);
    setIssue(found);
    if (found) return;
    mutation.mutate({ accessToken, password, refreshToken }, { onSuccess: finish });
  };
  return {
    confirmation,
    isSaving: mutation.isPending,
    issue,
    issueText: issue ? t(ISSUE_KEYS[issue]) : null,
    message: issue ? null : (mutation.error?.message ?? null),
    onSubmit,
    password,
    setConfirmation,
    setPassword,
    t,
  };
}

function PasswordField(props: {
  error: string | null;
  label: string;
  onChangeText: (value: string) => void;
  value: string;
}): React.JSX.Element {
  return (
    <View>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        onChangeText={props.onChangeText}
        placeholder={props.label}
        placeholderTextColor={PLACEHOLDER_COLOR}
        secureTextEntry
        style={styles.input}
        value={props.value}
      />
      {props.error ? <Text style={styles.error}>{props.error}</Text> : null}
    </View>
  );
}

function AuthCard(props: { children: React.ReactNode }): React.JSX.Element {
  return (
    <View style={styles.page}>
      <View style={styles.card}>{props.children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgSoft,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    maxWidth: 420,
    padding: 24,
    width: '100%',
  },
  title: {
    color: LIGHT.textStrong,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: LIGHT.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  fieldLabel: {
    color: LIGHT.accentMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: LIGHT.bgSoft,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusSm,
    borderWidth: 1,
    color: LIGHT.textStrong,
    fontSize: 15,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  error: {
    color: LIGHT.error,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: -8,
  },
  button: {
    alignItems: 'center',
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusMd,
    height: 48,
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: LIGHT.textOnNavy,
    fontSize: 15,
    fontWeight: '800',
  },
});
