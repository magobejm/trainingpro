import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import '../../i18n';
import { useLoginMutation } from '../../data/hooks/useAuthMutations';
import { LIGHT } from '../../theme/light';

const EMAIL_PROPS = {
  autoCapitalize: 'none' as const,
  keyboardType: 'email-address' as const,
};

const ACCESSIBILITY_ROLE_BUTTON = 'button' as const;
const PLACEHOLDER_COLOR = LIGHT.accentMuted;

export function LoginScreen(): React.JSX.Element {
  const vm = useLoginViewModel();
  return <LoginCard {...vm} />;
}

function useLoginViewModel() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const loginMutation = useLoginMutation();
  const onLogin = (): void => {
    loginMutation.mutate({ email, password });
  };
  const error = mapErrorMessage(loginMutation.error, t('auth.login.error'));
  const isLoading = loginMutation.isPending;
  return { t, email, password, error, isLoading, onLogin, setEmail, setPassword };
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
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>{'🏋️'}</Text>
        </View>
        <Text style={styles.appName}>{props.t('app.title')}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>{props.t('auth.login.title')}</Text>
        <Text style={styles.subtitle}>{props.t('auth.login.subtitle')}</Text>
        <Text style={styles.fieldLabel}>{props.t('auth.login.email.placeholder')}</Text>
        <TextInput
          {...EMAIL_PROPS}
          onChangeText={props.setEmail}
          placeholder={props.t('auth.login.email.placeholder')}
          placeholderTextColor={PLACEHOLDER_COLOR}
          style={styles.input}
          value={props.email}
        />
        <Text style={styles.fieldLabel}>{props.t('auth.login.password.placeholder')}</Text>
        <TextInput
          onChangeText={props.setPassword}
          placeholder={props.t('auth.login.password.placeholder')}
          placeholderTextColor={PLACEHOLDER_COLOR}
          secureTextEntry
          style={styles.input}
          value={props.password}
        />
        {props.error ? <Text style={styles.error}>{props.error}</Text> : null}
        <Pressable accessibilityRole={ACCESSIBILITY_ROLE_BUTTON} onPress={props.onLogin} style={styles.button}>
          {renderSubmitContent(props.isLoading, props.t('auth.login.submit'))}
        </Pressable>
      </View>
    </View>
  );
}

function renderSubmitContent(isLoading: boolean, label: string): React.JSX.Element {
  if (isLoading) {
    return <ActivityIndicator color={LIGHT.textOnNavy} />;
  }
  return <Text style={styles.buttonText}>{label}</Text>;
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgSoft,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoWrap: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    marginBottom: 12,
    width: 72,
  },
  logoEmoji: {
    fontSize: 36,
  },
  appName: {
    color: LIGHT.textStrong,
    fontSize: 24,
    fontWeight: '800',
  },
  card: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    maxWidth: 420,
    padding: 24,
    shadowColor: LIGHT.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    width: '100%',
  },
  fieldLabel: {
    color: LIGHT.accentMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
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
  error: {
    color: LIGHT.error,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
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
  subtitle: {
    color: LIGHT.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  title: {
    color: LIGHT.textStrong,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
});
