import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import '../../i18n';
import { useLoginMutation, usePasswordResetMutation } from '../../data/hooks/useAuthMutations';
import { readSessionExpired } from '../../data/session-end';
import { usePasswordRecoveryStore } from '../../store/password-recovery.store';
import { isValidEmail, readResetNotice } from './login-form.logic';
import { Button, TextField, colors, fontSize, radius, space } from '@trainerpro/ui';

const COLORS = {
  error: colors.danger,
  page: colors.surfaceMuted,
  primary: colors.primary,
  text: colors.text,
  white: colors.surface,
  muted: colors.textMuted,
};

const ALERT_ROLE = 'alert' as const;
const VARIANT_GHOST = 'ghost' as const;
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
  const error = mapErrorMessage(loginMutation.error, t('auth.login.error'));
  const passwordUpdated = usePasswordRecoveryStore((state) => state.passwordUpdated);
  const resetNotice = passwordUpdated
    ? { isError: false, text: t('auth.reset.updated') }
    : readResetNotice(resetMutation, t);
  const sessionExpired = readSessionExpired();
  return {
    t,
    email,
    emailError,
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
        <TextField
          {...EMAIL_PROPS}
          containerStyle={styles.field}
          error={props.emailError}
          label={props.t('auth.login.email.placeholder')}
          onChangeText={props.setEmail}
          onSubmitEditing={props.onLogin}
          value={props.email}
        />
        <TextField
          containerStyle={styles.field}
          label={props.t('auth.login.password.placeholder')}
          onChangeText={props.setPassword}
          onSubmitEditing={props.onLogin}
          secureTextEntry
          value={props.password}
        />
        {props.error ? (
          <Text accessibilityRole={ALERT_ROLE} style={styles.error}>
            {props.error}
          </Text>
        ) : null}
        {props.resetNotice ? (
          <Text style={props.resetNotice.isError ? styles.error : styles.notice}>{props.resetNotice.text}</Text>
        ) : null}
        <Button
          fullWidth
          label={props.isLoading ? props.t('auth.login.submitting') : props.t('auth.login.submit')}
          loading={props.isLoading}
          onPress={props.onLogin}
        />
        <Button
          label={props.t('auth.login.forgot')}
          onPress={props.onForgotPassword}
          style={styles.forgotLink}
          variant={VARIANT_GHOST}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: radius.lg,
    padding: space.xl,
    width: 420,
  },
  error: {
    color: COLORS.error,
    fontSize: fontSize.sm,
    marginBottom: space.sm,
  },
  field: {
    marginBottom: space.md,
  },
  forgotLink: {
    alignSelf: 'center',
    marginTop: space.md,
  },
  notice: {
    color: COLORS.muted,
    fontSize: fontSize.sm,
    marginBottom: space.sm,
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
