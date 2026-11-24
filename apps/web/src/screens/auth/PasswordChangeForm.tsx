import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Button, TextField, colors, fontSize, space, useToast } from '@trainerpro/ui';
import { validateNewPassword, type PasswordIssue } from '@trainerpro/shared';
import { changeCurrentPassword } from '../../data/auth-service';

const ISSUE_KEYS: Record<PasswordIssue, string> = {
  mismatch: 'auth.reset.mismatch',
  tooShort: 'auth.reset.tooShort',
};

export function PasswordChangeForm(): React.JSX.Element {
  const { t } = useTranslation();
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [issue, setIssue] = useState<PasswordIssue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const onSubmit = (): void => {
    if (pending) return;
    const found = validateNewPassword(password, confirmation);
    setIssue(found);
    setError(null);
    setSaved(false);
    if (found) return;
    setPending(true);
    void changeCurrentPassword({ currentPassword, password })
      .then(() => {
        setCurrentPassword('');
        setPassword('');
        setConfirmation('');
        setSaved(true);
        toast.success(t('auth.password.updated'));
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : t('auth.password.error'));
      })
      .finally(() => setPending(false));
  };
  const issueText = issue ? t(ISSUE_KEYS[issue]) : null;
  return (
    <View style={styles.form}>
      <Text style={styles.title}>{t('auth.password.title')}</Text>
      <TextField
        label={t('auth.password.current')}
        onChangeText={setCurrentPassword}
        secureTextEntry
        value={currentPassword}
      />
      <TextField
        error={issue === 'tooShort' ? issueText : null}
        label={t('auth.reset.password.placeholder')}
        onChangeText={setPassword}
        secureTextEntry
        value={password}
      />
      <TextField
        error={issue === 'mismatch' ? issueText : null}
        label={t('auth.reset.confirm.placeholder')}
        onChangeText={setConfirmation}
        onSubmitEditing={onSubmit}
        secureTextEntry
        value={confirmation}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {saved ? <Text style={styles.saved}>{t('auth.password.updated')}</Text> : null}
      <Button
        label={pending ? t('auth.password.saving') : t('auth.password.submit')}
        loading={pending}
        onPress={onSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    color: colors.danger,
    fontSize: fontSize.sm,
  },
  form: {
    gap: space.sm,
  },
  saved: {
    color: colors.success,
    fontSize: fontSize.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
