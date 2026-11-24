import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Link } from 'react-router';
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

const HERO_SOURCE = { uri: '/login-hero.jpg' };
const LOGO_SOURCE = { uri: '/logo.png' };
const STACKED_BREAKPOINT = 900;

function LoginCard(props: LoginCardProps): React.JSX.Element {
  const stacked = useWindowDimensions().width < STACKED_BREAKPOINT;
  return (
    <View style={stacked ? styles.pageStacked : styles.page}>
      <LoginHero
        headline={props.t('auth.login.heroTitle')}
        label={props.t('auth.login.hero')}
        lead={props.t('auth.login.heroLead')}
        stacked={stacked}
        title={props.t('app.title')}
      />
      <View style={styles.formSide}>
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
        <Link style={styles.privacyLink} to={'/privacidad'}>
          {props.t('auth.login.privacy')}
        </Link>
      </View>
      </View>
    </View>
  );
}

function LoginHero(props: {
  headline: string;
  label: string;
  lead: string;
  stacked: boolean;
  title: string;
}): React.JSX.Element {
  return (
    <View style={props.stacked ? styles.heroStacked : styles.hero}>
      <Image accessibilityLabel={props.label} resizeMode={'cover'} source={HERO_SOURCE} style={styles.heroImage} />
      <View style={styles.brand}>
        <Image accessibilityLabel={props.title} resizeMode={'contain'} source={LOGO_SOURCE} style={styles.logo} />
        <Text style={styles.brandLabel}>{props.title}</Text>
      </View>
      <View style={styles.heroCopy}>
        <Text style={styles.heroTitle}>{props.headline}</Text>
        {props.stacked ? null : <Text style={styles.heroLead}>{props.lead}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    alignItems: 'center',
    backgroundColor: colors.surfaceInverse,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: space.sm,
    left: space.lg,
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    position: 'absolute',
    top: space.lg,
    zIndex: 1,
  },
  brandLabel: {
    color: colors.textInverse,
    fontSize: fontSize.md,
    fontWeight: '800',
  },
  logo: {
    borderRadius: radius.sm,
    height: 48,
    width: 48,
  },
  card: {
    backgroundColor: COLORS.white,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    maxWidth: 420,
    padding: space.xl,
    width: '100%',
  },
  formSide: {
    alignItems: 'center',
    backgroundColor: COLORS.page,
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    overflow: 'auto',
    padding: space.xl,
  },
  hero: {
    backgroundColor: colors.surfaceInverse,
    flexBasis: '50%',
    flexGrow: 0,
    flexShrink: 0,
    overflow: 'hidden',
  },
  heroCopy: {
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    bottom: 0,
    gap: space.sm,
    left: 0,
    padding: space.xl,
    position: 'absolute',
    right: 0,
    zIndex: 1,
  },
  heroLead: {
    color: colors.textInverseMuted,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  heroTitle: {
    color: colors.textInverse,
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  heroImage: {
    bottom: 0,
    height: '100%',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
  },
  heroStacked: {
    backgroundColor: colors.surfaceInverse,
    height: 220,
    overflow: 'hidden',
    width: '100%',
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
  privacyLink: {
    alignSelf: 'center',
    color: COLORS.muted,
    fontSize: fontSize.sm,
    marginTop: space.md,
  },
  page: {
    backgroundColor: COLORS.page,
    flex: 1,
    flexDirection: 'row',
  },
  pageStacked: {
    backgroundColor: COLORS.page,
    flex: 1,
    overflow: 'auto',
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
