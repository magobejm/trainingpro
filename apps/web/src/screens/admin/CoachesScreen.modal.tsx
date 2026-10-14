import React, { useState } from 'react';

import { Text, View } from 'react-native';
import { Button, Modal, TextField } from '@trainerpro/ui';
import '../../i18n';
import { type CreateCoachResult } from '../../data/hooks/useCoachMutations';

import { styles } from './CoachesScreen.styles';
import { MONO_FONT_PROPS } from '../../layout/font-props';

export function CreateCoachModal(props: {
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  t: (key: string) => string;
  visible: boolean;
}): React.JSX.Element {
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    props.onSubmit(trimmed);
    setEmail('');
  };

  const handleClose = () => {
    setEmail('');
    props.onClose();
  };

  const canSubmit = email.trim().length > 0;
  return (
    <Modal
      closeLabel={props.t('common.close')}
      footer={
        <>
          <Button label={props.t('admin.coaches.createModal.cancel')} onPress={handleClose} variant="secondary" />
          <Button
            disabled={!canSubmit}
            label={
              props.isLoading ? props.t('admin.coaches.createModal.loading') : props.t('admin.coaches.createModal.submit')
            }
            loading={props.isLoading}
            onPress={handleSubmit}
          />
        </>
      }
      onClose={handleClose}
      size="sm"
      title={props.t('admin.coaches.createModal.title')}
      visible={props.visible}
    >
      <TextField
        autoCapitalize={'none'}
        autoComplete={'email'}
        keyboardType={'email-address'}
        label={props.t('admin.coaches.createModal.emailPlaceholder')}
        onChangeText={setEmail}
        value={email}
      />
    </Modal>
  );
}

export function ResultBanner(props: {
  onClose: () => void;
  onCopyPassword: (password: string) => void;
  passwordCopied: boolean;
  result: CreateCoachResult;
  t: (key: string) => string;
}): React.JSX.Element {
  const { temporaryPassword, userCreated } = props.result.credentials;
  return (
    <View style={styles.resultBanner}>
      <View style={styles.resultContent}>
        {userCreated && temporaryPassword ? (
          <>
            <Text style={styles.resultText}>{props.t('admin.coaches.createModal.successWithPassword')}</Text>
            <Text {...MONO_FONT_PROPS} style={styles.resultPassword}>
              {temporaryPassword}
            </Text>
            <Button
              label={
                props.passwordCopied
                  ? props.t('admin.coaches.createModal.passwordCopied')
                  : props.t('admin.coaches.createModal.copyPassword')
              }
              onPress={() => props.onCopyPassword(temporaryPassword)}
              size="sm"
              style={styles.copyButton}
              variant="secondary"
            />
          </>
        ) : (
          <Text style={styles.resultText}>{props.t('admin.coaches.createModal.success')}</Text>
        )}
      </View>
      <Button
        label={props.t('admin.coaches.createModal.dismiss')}
        onPress={props.onClose}
        size="sm"
        style={styles.resultClose}
        variant="ghost"
      />
    </View>
  );
}

export function readInitials(email: string): string {
  const token = email.split('@')[0] ?? '';
  const [a, b] = token.replace(/[^a-zA-Z]/g, '').toUpperCase();
  return `${a ?? 'C'}${b ?? 'O'}`;
}

export function readStatusLabel(isActive: boolean, t: (key: string) => string): string {
  return isActive ? t('admin.coaches.status.active') : t('admin.coaches.status.inactive');
}

export function readToggleLabel(isActive: boolean, t: (key: string) => string): string {
  return isActive ? t('admin.coaches.deactivate') : t('admin.coaches.activate');
}
