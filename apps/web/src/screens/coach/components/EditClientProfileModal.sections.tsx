import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Button, useToast } from '@trainerpro/ui';
import { styles } from './EditClientProfileModal.styles';

type Translator = (key: string, params?: Record<string, number | string>) => string;

type ResetProps = {
  isResettingPassword: boolean;
  onRequestConfirm: () => void;
  resetPassword: null | string;
  t: Translator;
};

type ArchiveProps = {
  isArchiving: boolean;
  onRequestConfirm: () => void;
  t: Translator;
};

export function ResetPasswordSection(props: ResetProps): React.JSX.Element {
  const toast = useToast();
  const doneMessage = props.t('coach.clientProfile.resetPassword.done');
  useEffect(() => {
    if (props.resetPassword) toast.success(doneMessage);
    // Solo cuando aparece una contraseña nueva.
  }, [props.resetPassword]);
  return (
    <View style={styles.resetBox}>
      <View style={styles.sectionRow}>
        <Text style={styles.resetText}>{props.t('coach.clientProfile.resetPassword.notice')}</Text>
        <Button
          label={
            props.isResettingPassword
              ? props.t('coach.clientProfile.resetPassword.loading')
              : props.t('coach.clientProfile.resetPassword.action')
          }
          loading={props.isResettingPassword}
          onPress={props.onRequestConfirm}
          size="sm"
        />
      </View>
      {props.resetPassword ? (
        <Text style={styles.resetPasswordValue}>
          {props.t('coach.clientProfile.resetPassword.line', {
            label: props.t('coach.clientProfile.resetPassword.value'),
            value: props.resetPassword,
          })}
        </Text>
      ) : null}
    </View>
  );
}

export function ArchiveSection(props: ArchiveProps): React.JSX.Element {
  return (
    <View style={styles.archiveBox}>
      <View style={styles.sectionRow}>
        <Text style={styles.archiveText}>{props.t('coach.clientProfile.archive.notice')}</Text>
        <Button
          label={
            props.isArchiving ? props.t('coach.clientProfile.archive.archiving') : props.t('coach.clientProfile.archive')
          }
          loading={props.isArchiving}
          onPress={props.onRequestConfirm}
          size="sm"
          variant="danger"
        />
      </View>
    </View>
  );
}
