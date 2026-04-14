import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import '../../i18n';
import { useLoginMutation } from '../../data/hooks/useAuthMutations';

const COLORS = {
  error: '#f87171',
  page: '#07000f',
  primary: '#ec4899',
  text: '#ffffff',
  white: '#ffffff',
  muted: 'rgba(196,181,253,0.8)',
  inputBg: 'rgba(20,0,50,0.8)',
  inputBorder: 'rgba(139,92,246,0.35)',
  cardBg: 'rgba(0,0,0,0.55)',
  cardBorder: 'rgba(139,92,246,0.2)',
};

const EMAIL_PROPS = {
  autoCapitalize: 'none' as const,
  keyboardType: 'email-address' as const,
};

const ACCESSIBILITY_ROLE_BUTTON = 'button' as const;

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
      <View style={styles.card}>
        <Text style={styles.title}>{props.t('auth.login.title')}</Text>
        <Text style={styles.subtitle}>{props.t('auth.login.subtitle')}</Text>
        <TextInput
          {...EMAIL_PROPS}
          onChangeText={props.setEmail}
          placeholder={props.t('auth.login.email.placeholder')}
          style={styles.input}
          value={props.email}
        />
        <TextInput
          onChangeText={props.setPassword}
          placeholder={props.t('auth.login.password.placeholder')}
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
    return <ActivityIndicator color={COLORS.white} />;
  }
  return <Text style={styles.buttonText}>{label}</Text>;
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 420,
    padding: 20,
    width: '100%',
  },
  error: {
    color: COLORS.error,
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.inputBorder,
    borderRadius: 10,
    borderWidth: 1,
    color: COLORS.text,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  page: {
    alignItems: 'center',
    backgroundColor: COLORS.page,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    marginBottom: 18,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
});
