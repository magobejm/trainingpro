import React from 'react';
import { Pressable, Text, View } from 'react-native';
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
  return (
    <View style={styles.resetBox}>
      <View style={styles.sectionRow}>
        <Text style={styles.resetText}>{props.t('coach.clientProfile.resetPassword.notice')}</Text>
        <Pressable onPress={props.onRequestConfirm} style={styles.resetButton}>
          <Text style={styles.resetLabel}>
            {props.isResettingPassword
              ? props.t('coach.clientProfile.resetPassword.loading')
              : props.t('coach.clientProfile.resetPassword.action')}
          </Text>
        </Pressable>
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
        <Pressable onPress={props.onRequestConfirm} style={styles.archiveButton}>
          <Text style={styles.archiveLabel}>
            {props.isArchiving
              ? props.t('coach.clientProfile.archive.archiving')
              : props.t('coach.clientProfile.archive')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
