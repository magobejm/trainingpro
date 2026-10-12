import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import '../../i18n';
import { validateNewPassword, type PasswordIssue } from '../../data/password-recovery';
import { useCompleteRecoveryMutation } from '../../data/hooks/useAuthMutations';
import { usePasswordRecoveryStore } from '../../store/password-recovery.store';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

const COLORS = {
  error: colors.danger,
  inputBg: colors.background,
  inputBorder: colors.border,
  muted: colors.textMuted,
  page: colors.surfaceMuted,
  primary: colors.primary,
  text: colors.text,
  white: colors.surface,
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
  input: {
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.inputBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.sm,
  },
  page: {
    alignItems: 'center',
    backgroundColor: COLORS.page,
    flex: 1,
    justifyContent: 'center',
    padding: space.xl,
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
