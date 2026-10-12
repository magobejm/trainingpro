import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CreateClientResult } from '../../../data/hooks/useClientMutations';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

type Props = {
  isResettingPassword?: boolean;
  onClose: () => void;
  onResetPassword?: () => void;
  result: CreateClientResult;
  t: (key: string, params?: Record<string, number | string>) => string;
};

export function CreateClientResultBanner(props: Props): React.JSX.Element {
  const fullName = `${props.result.client.firstName} ${props.result.client.lastName}`.trim();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{props.t('coach.clients.credentials.title')}</Text>
        <Pressable onPress={props.onClose}>
          <Text style={styles.close}>{props.t('coach.clients.credentials.close')}</Text>
        </Pressable>
      </View>
      <Text style={styles.line}>{formatLine(props, 'coach.clients.credentials.email', props.result.client.email)}</Text>
      <Text style={styles.line}>{formatLine(props, 'coach.clients.credentials.client', fullName)}</Text>
      <Text style={styles.line}>{resolveStatusLabel(props)}</Text>
      {props.result.credentials.temporaryPassword ? (
        <Text style={styles.password}>
          {formatLine(props, 'coach.clients.credentials.tempPassword', props.result.credentials.temporaryPassword)}
        </Text>
      ) : null}
      {showResetPasswordAction(props) ? (
        <Pressable onPress={props.onResetPassword} style={styles.resetButton}>
          <Text style={styles.resetButtonLabel}>{resetButtonLabel(props)}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function formatLine(props: Props, labelKey: string, value: string): string {
  return props.t('coach.clients.credentials.line', { label: props.t(labelKey), value });
}

function resolveStatusLabel(props: Props): string {
  if (props.result.credentials.userCreated) {
    return props.t('coach.clients.credentials.created');
  }
  return props.t('coach.clients.credentials.reused');
}

function resetButtonLabel(props: Props): string {
  return props.isResettingPassword
    ? props.t('coach.clients.credentials.resetting')
    : props.t('coach.clients.credentials.reset');
}

function showResetPasswordAction(props: Props): boolean {
  return Boolean(props.onResetPassword && !props.result.credentials.userCreated);
}

const styles = StyleSheet.create({
  close: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  container: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: space.xs,
    padding: space.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  line: {
    color: colors.text,
    fontSize: fontSize.xs,
  },
  password: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '800',
    marginTop: 2,
  },
  resetButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    marginTop: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  resetButtonLabel: {
    color: colors.surface,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
});
