import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import '../../i18n';
import { useLoginMutation, usePasswordResetMutation } from '../../data/hooks/useAuthMutations';
import { readSessionExpired } from '../../data/session-end';
import { usePasswordRecoveryStore } from '../../store/password-recovery.store';
import { isValidEmail, readResetNotice } from './login-form.logic';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

const COLORS = {
  error: colors.danger,
  page: colors.surfaceMuted,
  primary: colors.primary,
  text: colors.text,
  white: colors.surface,
  muted: colors.textMuted,
  inputBg: colors.background,
  inputBorder: colors.border,
};

const ALERT_ROLE = 'alert' as const;
const EMAIL_PROPS = {
  autoCapitalize: 'none' as const,
  keyboardType: 'email-address' as const,
};

export function LoginScreen(): React.JSX.Element {
  const vm = useLoginViewModel();
  return <LoginCard {...vm} />;
}

function useLoginViewModel() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const loginMutation = useLoginMutation();
  const resetMutation = usePasswordResetMutation();
  const isLoading = loginMutation.isPending;
  const validateEmail = (): boolean => {
    const valid = isValidEmail(email);
    setEmailError(valid ? null : t('auth.login.email.invalid'));
    return valid;
  };
  const onLogin = (): void => {
    if (isLoading || !validateEmail()) {
      return;
    }
    loginMutation.mutate({ email: email.trim(), password });
  };
  const onForgotPassword = (): void => {
    if (resetMutation.isPending || !validateEmail()) {
      return;
    }
    resetMutation.mutate(email.trim());
  };
  const changeEmail = (value: string): void => {
    setEmail(value);
    setEmailError(null);
  };
  const error = emailError ?? mapErrorMessage(loginMutation.error, t('auth.login.error'));
  const passwordUpdated = usePasswordRecoveryStore((state) => state.passwordUpdated);
  const resetNotice = passwordUpdated
    ? { isError: false, text: t('auth.reset.updated') }
    : readResetNotice(resetMutation, t);
  const sessionExpired = readSessionExpired();
  return {
    t,
    email,
    password,
    error,
    isLoading,
    onForgotPassword,
    onLogin,
    resetNotice,
    sessionExpired,
    setEmail: changeEmail,
    setPassword,
  };
}

function mapErrorMessage(caught: unknown, fallback: string): string | null {
  if (!caught) {
    return null;
  }
  if (caught instanceof Error && caught.message) {
    return caught.message;
  }
  return fallback;
}

type LoginCardProps = ReturnType<typeof useLoginViewModel>;

function LoginCard(props: LoginCardProps): React.JSX.Element {
  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>{props.t('auth.login.title')}</Text>
        <Text style={styles.subtitle}>{props.t('auth.login.subtitle')}</Text>
        {props.sessionExpired ? (
          <Text accessibilityRole={ALERT_ROLE} style={styles.sessionExpired}>
            {props.t('auth.login.sessionExpired')}
          </Text>
        ) : null}
        <TextInput
          {...EMAIL_PROPS}
          onChangeText={props.setEmail}
          onSubmitEditing={props.onLogin}
          placeholder={props.t('auth.login.email.placeholder')}
          style={styles.input}
          value={props.email}
        />
        <TextInput
          onChangeText={props.setPassword}
          onSubmitEditing={props.onLogin}
          placeholder={props.t('auth.login.password.placeholder')}
          secureTextEntry
          style={styles.input}
          value={props.password}
        />
        {props.error ? <Text style={styles.error}>{props.error}</Text> : null}
        {props.resetNotice ? (
          <Text style={props.resetNotice.isError ? styles.error : styles.notice}>{props.resetNotice.text}</Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: props.isLoading, disabled: props.isLoading }}
          disabled={props.isLoading}
          onPress={props.onLogin}
          style={[styles.button, props.isLoading && styles.buttonDisabled]}
        >
          {renderSubmitContent(props.isLoading, props.t('auth.login.submit'), props.t('auth.login.submitting'))}
        </Pressable>
        <Pressable accessibilityRole="button" onPress={props.onForgotPassword} style={styles.forgotLink}>
          <Text style={styles.forgotLabel}>{props.t('auth.login.forgot')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function renderSubmitContent(isLoading: boolean, label: string, loadingLabel: string): React.JSX.Element {
  if (isLoading) {
    return (
      <View style={styles.loadingRow}>
        <ActivityIndicator color={COLORS.white} />
        <Text style={styles.buttonText}>{loadingLabel}</Text>
      </View>
    );
  }
  return <Text style={styles.buttonText}>{label}</Text>;
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: radius.lg,
    height: 48,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: space.xl,
    width: 420,
  },
  error: {
    color: COLORS.error,
    fontSize: fontSize.sm,
    marginBottom: space.sm,
  },
  forgotLabel: {
    color: COLORS.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  forgotLink: {
    alignItems: 'center',
    marginTop: space.lg,
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.sm,
  },
  notice: {
    color: COLORS.muted,
    fontSize: fontSize.sm,
    marginBottom: space.sm,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.inputBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  page: {
    alignItems: 'center',
    backgroundColor: COLORS.page,
    flex: 1,
    justifyContent: 'center',
    padding: space.xl,
  },
  sessionExpired: {
    color: COLORS.error,
    fontSize: fontSize.sm,
    marginBottom: space.md,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: fontSize.sm,
    marginBottom: space.lg,
  },
  title: {
    color: COLORS.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
    marginBottom: space.sm,
  },
});
