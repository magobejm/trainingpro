import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import '../../i18n';
import { validateNewPassword, type PasswordIssue } from '../../data/password-recovery';
import { useCompleteRecoveryMutation } from '../../data/hooks/useAuthMutations';
import { usePasswordRecoveryStore } from '../../store/password-recovery.store';
import { Button, TextField, colors, fontSize, radius, space } from '@trainerpro/ui';

const COLORS = {
  error: colors.danger,
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
        <Button fullWidth label={t('auth.reset.backToLogin')} onPress={dismiss} />
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
  const issueText = issue ? t(ISSUE_KEYS[issue]) : null;
  const message = issue ? null : (mutation.error?.message ?? null);
  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('auth.reset.title')}</Text>
        <Text style={styles.subtitle}>{t('auth.reset.subtitle')}</Text>
        <TextField
          containerStyle={styles.field}
          error={issue === 'tooShort' ? issueText : null}
          label={t('auth.reset.password.placeholder')}
          onChangeText={setPassword}
          onSubmitEditing={onSubmit}
          secureTextEntry
          value={password}
        />
        <TextField
          containerStyle={styles.field}
          error={issue === 'mismatch' ? issueText : null}
          label={t('auth.reset.confirm.placeholder')}
          onChangeText={setConfirmation}
          onSubmitEditing={onSubmit}
          secureTextEntry
          value={confirmation}
        />
        {message ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {message}
          </Text>
        ) : null}
        <Button
          fullWidth
          label={mutation.isPending ? t('auth.reset.saving') : t('auth.reset.submit')}
          loading={mutation.isPending}
          onPress={onSubmit}
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
  field: {
    marginBottom: space.md,
  },
  error: {
    color: COLORS.error,
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
