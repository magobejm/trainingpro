import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useToast } from '@trainerpro/ui';
import { validateNewPassword, type PasswordIssue } from '@trainerpro/shared';
import { changeCurrentPassword } from '../../data/auth-service';
import { CoachButton, CoachField, ui } from '../../features/coach/CoachUi';

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
    <View style={ui.card}>
      <Text style={ui.label}>{t('auth.password.title')}</Text>
      <CoachField label={t('auth.password.current')} onChange={setCurrentPassword} secure value={currentPassword} />
      <CoachField label={t('auth.reset.password.placeholder')} onChange={setPassword} secure value={password} />
      {issue === 'tooShort' ? <Text style={ui.error}>{issueText}</Text> : null}
      <CoachField label={t('auth.reset.confirm.placeholder')} onChange={setConfirmation} secure value={confirmation} />
      {issue === 'mismatch' ? <Text style={ui.error}>{issueText}</Text> : null}
      {error ? <Text style={ui.error}>{error}</Text> : null}
      {saved ? <Text style={ui.muted}>{t('auth.password.updated')}</Text> : null}
      <CoachButton
        label={pending ? t('auth.password.saving') : t('auth.password.submit')}
        loading={pending}
        onPress={onSubmit}
      />
    </View>
  );
}
