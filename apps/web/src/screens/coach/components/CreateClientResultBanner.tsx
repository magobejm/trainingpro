import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CreateClientResult } from '../../../data/hooks/useClientMutations';
import { Button, colors, fontSize, radius, space, useToast } from '@trainerpro/ui';

type Props = {
  isResettingPassword?: boolean;
  onClose: () => void;
  onResetPassword?: () => void;
  result: CreateClientResult;
  t: (key: string, params?: Record<string, number | string>) => string;
};

export function CreateClientResultBanner(props: Props): React.JSX.Element {
  const fullName = `${props.result.client.firstName} ${props.result.client.lastName}`.trim();
  const toast = useToast();
  const { result } = props;
  const successMessage = resolveStatusLabel(props);
  useEffect(() => {
    toast.success(successMessage);
    // Solo al mostrarse un resultado nuevo.
  }, [result]);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{props.t('coach.clients.credentials.title')}</Text>
        <Button label={props.t('coach.clients.credentials.close')} onPress={props.onClose} size="sm" variant="ghost" />
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
        <Button
          label={resetButtonLabel(props)}
          loading={props.isResettingPassword}
          onPress={props.onResetPassword ?? noop}
          size="sm"
          style={styles.resetButton}
        />
      ) : null}
    </View>
  );
}

const noop = (): void => undefined;

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
    alignSelf: 'flex-start',
    marginTop: space.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
});
