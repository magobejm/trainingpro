import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import '../../i18n';
import { validateNewPassword, type PasswordIssue } from '../../data/password-recovery';
import { useCompleteRecoveryMutation } from '../../data/hooks/useAuthMutations';
import { usePasswordRecoveryStore } from '../../store/password-recovery.store';

const COLORS = {
  error: '#b42318',
  inputBg: '#f4f6f8',
  inputBorder: '#d8dee5',
  muted: '#667085',
  page: '#f6f7f8',
  primary: '#1c74e9',
  text: '#111418',
  white: '#ffffff',
};

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
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('auth.reset.invalid.title')}</Text>
        <Text style={styles.subtitle}>{t('auth.reset.invalid.message')}</Text>
        <Pressable accessibilityRole="button" onPress={dismiss} style={styles.button}>
          <Text style={styles.buttonText}>{t('auth.reset.backToLogin')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function NewPasswordCard(): React.JSX.Element {
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
  const message = issue ? t(ISSUE_KEYS[issue]) : (mutation.error?.message ?? null);
  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('auth.reset.title')}</Text>
        <Text style={styles.subtitle}>{t('auth.reset.subtitle')}</Text>
        <TextInput
          onChangeText={setPassword}
          onSubmitEditing={onSubmit}
          placeholder={t('auth.reset.password.placeholder')}
          secureTextEntry
          style={styles.input}
          value={password}
        />
        <TextInput
          onChangeText={setConfirmation}
          onSubmitEditing={onSubmit}
          placeholder={t('auth.reset.confirm.placeholder')}
          secureTextEntry
          style={styles.input}
          value={confirmation}
        />
        {message ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {message}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: mutation.isPending, disabled: mutation.isPending }}
          disabled={mutation.isPending}
          onPress={onSubmit}
          style={[styles.button, mutation.isPending && styles.buttonDisabled]}
        >
          {mutation.isPending ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.white} />
              <Text style={styles.buttonText}>{t('auth.reset.saving')}</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>{t('auth.reset.submit')}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: 420,
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
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
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
